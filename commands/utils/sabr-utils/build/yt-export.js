"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.yt = yt;
exports.download = download;
const utils_1 = require("googlevideo/utils");
const youtubei_js_1 = require("youtubei.js");
const sabr_stream_1 = require("googlevideo/sabr-stream");
const node_fs_1 = require("node:fs");
const utils_2 = require("googlevideo/utils");
const node_path_1 = __importDefault(require("node:path"));
const webpo_helper_js_1 = require("./utils/webpo-helper.js");
const OPTIONS = {
    preferWebM: true,
    preferOpus: true,
    audioQuality: 'AUDIO_QUALITY_MEDIUM',
    // Maybe change in the future to get better quality
    enabledTrackTypes: utils_1.EnabledTrackTypes.VIDEO_AND_AUDIO
};
youtubei_js_1.Platform.shim.eval = async (data, env) => {
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
function createStreamSink(format, outputStream) {
    let size = 0;
    const totalSize = Number(format.contentLength || 0);
    return new WritableStream({
        write(chunk) {
            return new Promise((resolve, reject) => {
                size += chunk.length;
                outputStream.write(chunk, (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        },
        close() {
            outputStream.end();
        }
    });
}
async function makePlayerRequest(innertube, videoId, reloadPlaybackContext) {
    const watchEndpoint = new youtubei_js_1.YTNodes.NavigationEndpoint({ watchEndpoint: { videoId } });
    const extraArgs = {
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
async function createSabrStream(innertube, videoId, options) {
    const webPoTokenResult = await (0, webpo_helper_js_1.generateWebPoToken)(videoId);
    const playerResponse = await makePlayerRequest(innertube, videoId);
    const videoTitle = playerResponse.video_details?.title || 'Unknown Video';
    const serverAbrStreamingUrl = await innertube.session.player?.decipher(playerResponse.streaming_data?.server_abr_streaming_url);
    const videoPlaybackUstreamerConfig = playerResponse.player_config?.media_common_config.media_ustreamer_request_config?.video_playback_ustreamer_config;
    const sabrFormats = playerResponse.streaming_data?.adaptive_formats.map(utils_2.buildSabrFormat) || [];
    const serverAbrStream = new sabr_stream_1.SabrStream({
        formats: sabrFormats,
        serverAbrStreamingUrl,
        videoPlaybackUstreamerConfig,
        poToken: webPoTokenResult.poToken,
        clientInfo: {
            clientName: parseInt(youtubei_js_1.Constants.CLIENT_NAME_IDS[innertube.session.context.client.clientName]),
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
function determineFileExtension(mimeType) {
    if (mimeType.includes('video')) {
        return mimeType.includes('webm') ? 'webm' : 'mp4';
    }
    else if (mimeType.includes('audio')) {
        return mimeType.includes('webm') ? 'webm' : 'm4a';
    }
    return 'bin';
}
function createOutputStream(title, mimeType, filepath) {
    const type = mimeType.includes('video') ? 'video' : 'audio';
    const extension = determineFileExtension(mimeType);
    const fileName = node_path_1.default.join(filepath, `${title}.${extension}`);
    return {
        stream: (0, node_fs_1.createWriteStream)(fileName, { flags: 'w', encoding: 'binary' }),
        filePath: fileName
    };
}
async function yt() {
    return await youtubei_js_1.Innertube.create({
        cache: new youtubei_js_1.UniversalCache(false),
        generate_session_locally: true
    });
}
;
async function download(yt, videoId, interactionId, filepath) {
    console.log("Downloading...");
    const { streamResults } = await createSabrStream(yt, videoId, OPTIONS);
    const { audioStream, selectedFormats, videoTitle } = streamResults;
    const title = interactionId || "song";
    filepath = filepath || "";
    const audioOutputStream = createOutputStream(title, selectedFormats.audioFormat.mimeType, filepath);
    await Promise.all([
        audioStream.pipeTo(createStreamSink(selectedFormats.audioFormat, audioOutputStream.stream))
    ]);
    console.log("Download complete!");
}
