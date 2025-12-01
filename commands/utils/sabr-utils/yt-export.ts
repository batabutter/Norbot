import { EnabledTrackTypes } from 'googlevideo/utils';
import { Constants, Innertube, UniversalCache, Utils, Platform, YTNodes } from 'youtubei.js';
import { SabrStream, type SabrPlaybackOptions } from 'googlevideo/sabr-stream';
import type { SabrFormat } from 'googlevideo/shared-types';
import { createWriteStream, type WriteStream } from 'node:fs';
import { buildSabrFormat } from 'googlevideo/utils';
import type { ReloadPlaybackContext } from 'googlevideo/protos';
import type { Types } from 'youtubei.js';
import path from "node:path";

import { generateWebPoToken } from './utils/webpo-helper.js';

const OPTIONS: SabrPlaybackOptions = {
  preferWebM: true,
  preferOpus: true,
  audioQuality: 'AUDIO_QUALITY_MEDIUM',
  // Maybe change in the future to get better quality
  enabledTrackTypes: EnabledTrackTypes.VIDEO_AND_AUDIO
};


Platform.shim.eval = async (data: Types.BuildScriptResult, env: Record<string, Types.VMPrimative>) => {
  const properties = [];

  if (env.n) {
    properties.push(`n: exportedVars.nFunction("${env.n}")`);
  }

  if (env.sig) {
    properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  }

  const code = `${data.output}\nreturn { ${properties.join(', ')} }`;

  return new Function(code)();
};

function createStreamSink(format: SabrFormat, outputStream: WriteStream) {
  let size = 0;
  const totalSize = Number(format.contentLength || 0);

  return new WritableStream({
    write(chunk) {
      return new Promise((resolve, reject) => {
        size += chunk.length;

        outputStream.write(chunk, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
    close() {
      outputStream.end();
    }
  });
}

async function makePlayerRequest(innertube: Innertube, videoId: string, reloadPlaybackContext?: ReloadPlaybackContext) {
  const watchEndpoint = new YTNodes.NavigationEndpoint({ watchEndpoint: { videoId } });
  const extraArgs: Record<string, any> = {
    playbackContext: {
      adPlaybackContext: { pyv: true },
      contentPlaybackContext: {
        vis: 0,
        splay: false,
        lactMilliseconds: '-1',
        signatureTimestamp: innertube.session.player?.signature_timestamp
      }
    },
    contentCheckOk: true,
    racyCheckOk: true
  };
  if (reloadPlaybackContext) {
    extraArgs.playbackContext.reloadPlaybackContext = reloadPlaybackContext;
  }
  return await watchEndpoint.call(innertube.actions, { ...extraArgs, parse: true });
}

async function createSabrStream(
  innertube: Innertube, videoId:
    string,
  options: SabrPlaybackOptions) {

  const webPoTokenResult = await generateWebPoToken(videoId);
  const playerResponse = await makePlayerRequest(innertube, videoId);
  const videoTitle = playerResponse.video_details?.title || 'Unknown Video';

  const serverAbrStreamingUrl = await innertube.session.player?.decipher(playerResponse.streaming_data?.server_abr_streaming_url);

  const videoPlaybackUstreamerConfig = playerResponse.player_config?.media_common_config.media_ustreamer_request_config?.video_playback_ustreamer_config;
  const sabrFormats = playerResponse.streaming_data?.adaptive_formats.map(buildSabrFormat) || [];
  const serverAbrStream = new SabrStream({
    formats: sabrFormats,
    serverAbrStreamingUrl,
    videoPlaybackUstreamerConfig,
    poToken: webPoTokenResult.poToken,
    clientInfo: {
      clientName: parseInt(Constants.CLIENT_NAME_IDS[innertube.session.context.client.clientName as keyof typeof Constants.CLIENT_NAME_IDS]),
      clientVersion: innertube.session.context.client.clientVersion
    }
  });

  const { videoStream, audioStream, selectedFormats } = await serverAbrStream.start(options);

  return {
    streamResults: {
      videoStream,
      audioStream,
      selectedFormats,
      videoTitle
    }
  };
}

function determineFileExtension(mimeType: any) {
  if (mimeType.includes('video')) {
    return mimeType.includes('webm') ? 'webm' : 'mp4';
  }
  else if (mimeType.includes('audio')) {
    return mimeType.includes('webm') ? 'webm' : 'm4a';
  }
  return 'bin';
}

function createOutputStream(title: string, mimeType: any, filepath:string) {
  const type = mimeType.includes('video') ? 'video' : 'audio';
  const extension = determineFileExtension(mimeType);
  const fileName = path.join(filepath, `${title}.${extension}`);
  return {
    stream: createWriteStream(fileName, { flags: 'w', encoding: 'binary' }),
    filePath: fileName
  };
}

export async function yt () {
  return await Innertube.create({
  cache: new UniversalCache(false),
  generate_session_locally: true});
};


export async function download(yt: Innertube, videoId: string, interactionId?: string, filepath?: string) {
  console.log("Downloading...")
  const { streamResults } = await createSabrStream(yt, videoId, OPTIONS);
  const { audioStream, selectedFormats, videoTitle } = streamResults;
  const title = interactionId || "song";
  filepath = filepath || ""

  const audioOutputStream = createOutputStream(title , selectedFormats.audioFormat.mimeType!, filepath);

  await Promise.all([
    audioStream.pipeTo(createStreamSink(selectedFormats.audioFormat, audioOutputStream.stream))
  ]);

  console.log("Download complete!")
}
