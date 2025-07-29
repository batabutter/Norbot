const { AudioPlayerStatus, VoiceConnectionStatus, createAudioResource } = require("@discordjs/voice")
const { SongQueue } = require("./songqueue")
const path = require('path');
const ytdl = require("@distube/ytdl-core");
const filePath = path.resolve(__dirname, '../audio.mp3');

const baseUrl = "http://localhost:3000/search/"
const playlistURL = "http://localhost:3000/playlist/items/"
const maxVideoLength = 7200

const guildPlaySessions = new Map()

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

    player.on(AudioPlayerStatus.Idle, async () => {
      this.songQueue.isPlayingFlagToggle(false)
      console.log("Free to play a song")
      if (!this.songQueue.isEmpty() || this.songQueue.isLoop() || this.songQueue.isLoopQueue()) {
        const content = this.songQueue.isLoop() ? this.songQueue.getPlayingInfo() : this.songQueue.removeSong();

        this.PlayNextResource(content.url)

        return await this.interaction.editReply(`Now Playing: ` +
          `**\"${content.name}\"** ${content.length}\nin \`${this.interaction.member.voice.channel.name}\` 🔊`)

      } else {

        return this.interaction.channel.send(`** Player stopped. ** ⏹️`);
      }
    })

    connection.on('stateChange', (oldState, newState) => {
      console.log(`Connection state changed from ${oldState.status} to ${newState.status}`);
    })

    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        this.endConnection()
        return this.interaction.editReply("**❌ Disconnected from VC**")
      } catch (error) {
        console.log(error.message)
      }
    })

    connection.on(VoiceConnectionStatus.Destroyed, async (oldState, newState) => {
      try {
        this.endConnection()

        console.log("Connection destroyed.")
        return interaction.editReply("**❓ Something went wrong... Connection was destroyed.**")
      } catch (error) {
        console.log(error.message)
      }
    })
  }

  GetQueue = () => this.songQueue

  GetPlayer = () => this.player

  GetSubscription = () => this.subscription

  GetVideoInfo = async (url, playerName) => {
    try {
      console.log("Entering video info")

      const { retUrl } = await this.validateUrl(url, playerName, this.songQueue)
      let info = await ytdl.getBasicInfo(retUrl)

      if (!info)
        return interaction.editReply("**❌ Video unavailable.**")

      const lengthSeconds = info.videoDetails.lengthSeconds
      if (lengthSeconds > maxVideoLength)
        return interaction.editReply("**❌ This video is too long! I can only play videos under 2 hours in length.**")

      /*
        Format declarations:
      */
      const formattedHours = String(Math.round(lengthSeconds / 60))
      const formattedSeconds = String(Math.round((lengthSeconds % 60))).padStart(2, 0)
      const audioLength = `[${formattedHours}:${formattedSeconds}]`

      return { retUrl, info, audioLength }

    } catch (error) {
      console.log("Error in GetInfo > " + error.message)
    }
  }

  PlayNextResource = async (url) => {
    try {

      if (this.songQueue.isTooFull())
        return this.interaction.editReply("**❌ Queue is too full! Please remove or clear the queue to add more songs.**")

      this.songQueue.setLoadingSongs(true)

      const { retUrl, info, audioLength } = await this.GetVideoInfo(url, this.interaction.user.tag)
      console.log("Url is now " + retUrl)
      console.log("Info is now ")

      if (this.songQueue.isPlaying()) {
        console.log("A song is playing...")
        this.songQueue.addSong(retUrl, this.interaction.user.tag, info.videoDetails.title, audioLength)

      } else {
        const stream = await ytdl(retUrl, { filter: 'audioonly' })
          .pipe(require("fs")
            .createWriteStream(filePath));

        await stream.on("finish", () => {
          console.log("finished downloading")
          const resource = createAudioResource(filePath);
          this.player.play(resource);
          return resource
        })
        this.songQueue.setQueueOutdated(true)
        this.songQueue.setPlayingSong(retUrl, this.interaction.user.tag, info.videoDetails.title, audioLength)
        this.songQueue.isPlayingFlagToggle(true)
        await this.AddPlaylist(retUrl, this.interaction.user.tag)

        this.songQueue.setLoadingSongs(false)

        return await this.interaction.editReply(`Now playing: **\"${info.videoDetails.title}\"** ${audioLength}\nin \`${this.interaction.member.voice.channel.name}\`. 🔊`)
      }

      const { numSongs, numUnavailableSongs } = await this.AddPlaylist(retUrl, this.interaction.user.tag)
      this.songQueue.setLoadingSongs(false)

      return await this.interaction.editReply(`Queued: ` +
        `**\"${info.videoDetails.title}\"** ${audioLength}\nin \`${this.interaction.member.voice.channel.name}\` 🔊 
          \n-# Queued ${numSongs} song${numSongs > 1 ? "s" : ""}. ✅` +
        `${numUnavailableSongs ? `\n-# ❌ Unavailable songs: ${numUnavailableSongs}. ` : ""}`)

    } catch (error) {
      console.log(error.message)
    }
  }

  endConnection = () => {

    console.log("Destroying connection by disconnecting")
    this.songQueue.clearQueue()
    this.songQueue.setQueueOutdated(true)
    this.songQueue.isPlayingFlagToggle(false)

    if (this.subscription)
      this.subscription.unsubscribe(this.player)

    this.connection.destroy()

    guildPlaySessions.delete(this.interaction.guild.id)

  }

  validateUrl = async (url, playerName) => {
    let retUrl = ""
    let numUnavailableSongs = 0
    let numSongs = 1
    let query = false
    if (!ytdl.validateURL(url)) {
      try {
        query = true
        const res = await fetch(`${baseUrl}${url}`)
        const json = await res.json()

        if (!res.ok)
          return this.interaction.editReply("**❌ Could not find a video with that url or title.**")

        retUrl = json[0]
        numSongs++;
      } catch (error) {
        console.log(error.message)
        return this.interaction.editReply("**❌ Invalid url or query. Please make sure to check your input then try again.**")
      }
    } else {
      const parsedURL = new URL(url)
      const listId = parsedURL.searchParams.get("list")
      let listItems = []
      retUrl = url
      /*
      if (listId) {
        console.log("Adding playlist > ")
        const index = parsedURL.searchParams.get("index")
        try {
          const res = await fetch(`${playlistURL}${listId}`)
          const json = await res.json()
          if (!res.ok)
            return this.interaction.editReply("**❌ Error obtaining videos in the playlist**")
          listItems = json
          if (!this.songQueue.isPlaying())
            listItems.splice(index, 1);

          for (let i = 0; (i < listItems.length) && (!this.songQueue.isTooFull()); i++) {
            const itemURL = listItems[i]
            try {
              let info = await ytdl.getBasicInfo(itemURL)
              if (info.videoDetails.lengthSeconds < maxVideoLength)
                await this.songQueue.addSong(itemURL, playerName, info.videoDetails.title, info.videoDetails.lengthSeconds)
              numSongs++
            } catch (error) {
              console.log("Video unavailable")
              numUnavailableSongs++
            }
          }
        } catch (error) {
          console.log(error.message)
          return this.interaction.editReply("**❌ Invalid url or query. Please make sure to check your input then try again.**")
        }
      } else {
        numSongs++
      }
      */
    }

    return { retUrl, query }

  }

  AddPlaylist = async (url, playerName) => {

    let numUnavailableSongs = 0
    let numSongs = 0 // Because of the current one

    try {

      const parsedURL = new URL(url)
      const listId = parsedURL.searchParams.get("list")
      let listItems = []
      let retUrl = url
      if (listId) {
        console.log("Adding playlist > ")
        const index = parsedURL.searchParams.get("index")
        try {
          const res = await fetch(`${playlistURL}${listId}`)
          const json = await res.json()
          if (!res.ok)
            return this.interaction.editReply("**❌ Error obtaining videos in the playlist**")
          listItems = json
          if (this.songQueue.isPlaying())
            listItems.splice(index, 1);

          for (let i = 0; (i < listItems.length) && (!this.songQueue.isTooFull()); i++) {
            const itemURL = listItems[i]
            console.log("Trying with > " + itemURL)
            let info
            try {
              info = await ytdl.getBasicInfo(itemURL)
            } catch (error) {
              console.log("Video unavailable > " + error.message)
              numUnavailableSongs++
            }
            if (info && info.videoDetails.lengthSeconds < maxVideoLength) {
              await this.songQueue.addSong(itemURL, playerName, info.videoDetails.title, info.videoDetails.lengthSeconds)
              numSongs++
            }

          }
        } catch (error) {
          console.log(error.message)
          return this.interaction.editReply("**❌ Invalid url or query. Please make sure to check your input then try again.**")
        }
      } else {
        numSongs++
      }
      console.log("song count = "+numSongs)
    } catch {
      console.log("Adding stopped")
    } finally {
      return { numUnavailableSongs, numSongs }
    }

  }

  SetInteraction = (interaction) => { this.interaction = interaction }

  GetConnection = () => this.connection

  GetPlayer = () => this.player

}
module.exports = {
  PlaySession,
  guildPlaySessions
}