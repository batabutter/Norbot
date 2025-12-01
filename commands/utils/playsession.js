const { AudioPlayerStatus, VoiceConnectionStatus, createAudioResource } = require("@discordjs/voice")
const { SongQueue } = require("./songqueue")
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { clearConnection } = require("./endConnection");
const { unlink, access } = require('fs/promises');
const { exec } = require('node:child_process');
const baseUrl = "http://localhost:3000/search/"
const playlistURL = "http://localhost:3000/playlist/items/"
const maxVideoLength = 7200
const maxIdleTimeMS = 600000

const NEXT_SONG_WAIT_TIME = 1000

const extension = "webm"

let yt;
let download;

(async () => {
  const filePath = path.join(__dirname, "sabr-utils", "build", "yt-export.js");
  const fileUrl = pathToFileURL(filePath).href;
  const module = await import(fileUrl);
  console.log("Module", module)
  yt = await module.default.yt();
  console.log(yt);
  download = module.download;
})();

class PlaySession {
  constructor(
    channelId,
    connection,
    player,
    subscription,
    interaction) {
    this.channelId = channelId
    this.connection = connection
    this.songQueue = new SongQueue()
    this.player = player
    this.subscription = subscription
    this.interaction = interaction
    this.reponse = ""
    this.start = 0
    this.songLengthSeconds = 0
    this.songPath = path.resolve(__dirname, `songs/${interaction.guild.id}.${extension}`)
    this.idleTimeout = null;

    player.on(AudioPlayerStatus.Idle, async () => {
      await new Promise(res => setTimeout(res, NEXT_SONG_WAIT_TIME));

      this.songQueue.isPlayingFlagToggle(false)
      console.log("Free to play a song")
      if (!this.songQueue.isEmpty() || this.songQueue.isLoop() || this.songQueue.isLoopQueue()) {
        const content = this.songQueue.isLoop() ? this.songQueue.getPlayingInfo() : this.songQueue.removeSong();
        this.PlayNextResource(content.url, false)

      } else {
        this.idleTimeout = setTimeout(async () => {
          await this.EndConnection()
          console.log("Timed out")
        }, maxIdleTimeMS)
      }

    })

    connection.on('stateChange', (oldState, newState) => {
      console.log(`Connection state changed from ${oldState.status} to ${newState.status}`);
    })

    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        console.log("Disconnecting...")
        await this.EndConnection()
      } catch (error) {
        console.log(error.message)
      }
    })

    connection.on(VoiceConnectionStatus.Destroyed, async (oldState, newState) => {
      try {
        console.log("Connection destroyed.")
        await this.EndConnection()
      } catch (error) {
        console.log(error.message)
      }
    })
  }

  GetQueue = () => this.songQueue

  GetPlayer = () => this.player

  GetSubscription = () => this.subscription

  GetVideoInfo = async (url) => {
    try {
      console.log("Entering video info")
      const urlInfo = await yt.resolveURL(url);
      const retUrl = url
      let info = await yt.getBasicInfo(urlInfo.payload.videoId)

      if (!info)
        throw new Error("**❌ Video unavailable.**")

      const audioLength = info.basic_info.duration
      if (audioLength > maxVideoLength)
        throw new Error("**❌ This video is too long! I can only play videos under 2 hours in length.**")

      /*
        Format declarations: 
      */
      return { retUrl, info, audioLength }

    } catch (error) {
      console.error("Error in GetInfo > " + error.message)
      throw new Error("❌ Invalid url or query. Please make sure to check your input then try again.")
    }
  }

  PlayNextResource = async (url, playNext) => {
    try {

      if (this.songQueue.isTooFull())
        return this.interaction.editReply("**❌ Queue is too full! Please remove or clear the queue to add more songs.**")


      /**
       * This needs to be fixed
       */
      const { retUrl, info, audioLength } = await this.GetVideoInfo(url)

      if (!info)
        throw new Error("Missing retURL, info, or audio length")

      if (playNext)
        this.songQueue.resetPlayNextOffset()

      this.songQueue.setForceStop(false)

      let formattedReply = `**\"${info.basic_info.title}\"** ${audioLength}\nin \`${this.interaction.guild.members.me.voice.channel.name}\`. 🔊`
      let queueInfo = ""
      let position = ""

      /* Move this to separate function */
      if (this.songQueue.isPlaying()) {
        console.log("A song is playing...")

        if (this.songQueue.getLoadingSongs())
          throw new Error(`**❌ Please wait until all the songs have been loaded into the queue to queue a new song.**`)

        this.songQueue.addSong(retUrl, this.interaction.user.tag, info.basic_info.title, audioLength, playNext)

        const { numSongs, numUnavailableSongs } = await this.AddPlaylist(retUrl, this.interaction.user.tag, playNext)

        queueInfo = `\n-# Queued ${numSongs} song${numSongs > 1 ? "s" : ""}. ✅` +
          `${numUnavailableSongs ? `\n-# ❌ Unavailable songs: ${numUnavailableSongs}. ` : ""}\n`
          + `\n-# Size of queue: ${this.songQueue.getSize()}`


      } else {
        /* This coed should appropriately download and use the song */
        console.log(info.basic_info.id)
        await download(yt, info.basic_info.id, this.interaction.guild.id, path.join(__dirname, "/songs"));

        await new Promise((resolve) => {
          const resource = createAudioResource(this.songPath)
          this.player.play(resource)
          resolve(resource)
        })

        this.startTime = Date.now() / 1000
        this.songLengthSeconds = audioLength
        this.songQueue.setQueueOutdated(true)
        this.songQueue.setPlayingSong(retUrl, this.interaction.user.tag, info.basic_info.title, audioLength)
        this.songQueue.isPlayingFlagToggle(true)
        if (this.idleTimeout)
          clearTimeout(this.idleTimeout)

        const { numSongs, numUnavailableSongs } = await this.AddPlaylist(retUrl, this.interaction.user.tag, playNext)

        if (numSongs > 1)
          queueInfo = `\n-# Queued ${numSongs - 1} song${numSongs > 1 ? "s" : ""}. ✅` +
            `${numUnavailableSongs ? `\n-# ❌ Unavailable songs: ${numUnavailableSongs}. ` : ""}\n`
            + `\n-# Size of queue: ${this.songQueue.getSize()}`

        try {
          return await this.interaction.editReply(`Now playing: ${formattedReply + queueInfo}`)
        } catch (error) {
          console.log(`Can't edit the reply: ${error.message}`)
          return await this.interaction.channel.send(`Now playing: ${formattedReply + queueInfo}`)
        }

      }
      return await this.interaction.followUp(`Queued: ${formattedReply + position + queueInfo}`)

    } catch (error) {
      throw new Error(error.message)
    }
  }

  EndConnection = async () => {
    await this.player.stop()
    await clearConnection(this.connection, this.player, this.interaction,
      this.subscription, this.songQueue)
    try {
      await unlink(this.songPath)
    } catch (error) {
      console.log("Error removing files > " + error.message)
    }
  }


  /* I don't think I need this anymore*/
  ValidateUrl = async (url) => {
    let retUrl = url
    let query = false

    if (!yt.resolveURL(url)) {
      try {
        query = true
        const res = await fetch(`${baseUrl}${url}`)
        const json = await res.json()

        if (!res.ok) {
          return await this.interaction.editReply("**❌ Could not find a video with that url or title.**")
        }

        retUrl = json[0]
      } catch (error) {
        throw new Error(`**❌ FATAL ERROR: ${error.message}❌**`)
      }
    }

    return { retUrl }
  }
  /* 
  This also needs to be thoroughly checked
  */
  AddPlaylist = async (url, playerName, playNext) => {

    let numUnavailableSongs = 0
    let numSongs = 1

    try {

      const parsedURL = new URL(url)
      const listId = parsedURL.searchParams.get("list")
      let listItems = []
      let retUrl = url
      if (listId) {
        this.songQueue.setLoadingSongs(true)
        console.log("Adding playlist > ")
        const index = parsedURL.searchParams.get("index")
        const res = await fetch(`${playlistURL}${listId}`)
        const json = await res.json()
        if (!res.ok)
          return this.interaction.editReply("**❌ Error obtaining videos in the playlist**")
        listItems = json
        console.log(listItems)

        if (index != null)
          listItems.splice(index - 1, 1);
        else
          listItems.splice(0, 1);


        for (let i = 0; (i < listItems.length) && (!this.songQueue.isTooFull()); i++) {
          const itemURL = listItems[i]
          console.log("[AddPlaylist] Trying with > " + itemURL)
          try {
            const { retUrl, info, audioLength } = await this.GetVideoInfo(itemURL)

            if (audioLength < maxVideoLength) {
              await this.songQueue.addSong(itemURL, playerName, info.basic_info.title, audioLength, playNext)
              numSongs++
              console.log("[AddPlaylist] Success! Added : ", itemURL);
            } else {
              console.log(`What > `,audioLength)
            }

          } catch (error) {
            console.log("Video unavailable > " + error.message)
            numUnavailableSongs++
          }
        }
      }
      console.log("song count = " + numSongs)
    } catch (error) {
      console.log("Adding stopped > " + error.message)
    } finally {
      this.songQueue.setLoadingSongs(false)
      return { numUnavailableSongs, numSongs }
    }

  }

  SetInteraction = (interaction) => { this.interaction = interaction }

  GetConnection = () => this.connection

  GetPlayer = () => this.player

  GetCurrentTime = () => (Date.now() / 1000) - this.startTime

  GetEndTime = () => this.songLengthSeconds

}
module.exports = {
  PlaySession
}