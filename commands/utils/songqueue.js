const { ButtonBuilder, ActionRow, ActionRowBuilder, EmbedBuilder, ButtonStyle } = require("discord.js")
const MAX_VIDEOS_IN_QUEUE = 120

class SongQueue {
    constructor() {
        this.songQueue = []
        this.isPlayingFlag = false
        this.loopSong = false
        this.loopQueue = false
        this.lastPlayedSong = {}
        this.displayQueue = []
        this.topOfQueue = 0
        this.numQueueItemsShow = 10
        this.queueOutdated = false
    }

    clearQueue = () => {
        this.songQueue = []
        this.queueOutdated = true
    }

    setDisplayQueue = (queue) => {
        this.displayQueue = queue
        this.topOfQueue = 0
    }

    getDisplayQueueSize = (queue) => this.displayQueue.length

    getTopOfQueue = () => this.topOfQueue

    setTopOfQueue = (value) => { this.topOfQueue = value }

    setQueueOutdated = (value) => { this.queueOutdated = value }

    isQueueOutdated = () => this.queueOutdated

    getPlayingInfo = () => this.lastPlayedSong

    getNumQueueItemsToDisplay = () => this.numQueueItemsShow

    removeSongAtPositon = (position) => {
        let result = false
        this.queueOutdated = true
        if (position >= 0 && position < this.songQueue.length) {
            this.songQueue.splice(position, 1)
            result = true
        } else {
            console.log(`Out of queue range! Cannot remove at position ${position}`)
        }

        return result
    }

    isEmpty = () => this.songQueue.length == 0;

    getSize = () => this.songQueue.length

    isPlayingFlagToggle = (val) => { this.isPlayingFlag = val }

    setPlayingSong = (url, player, name, audioLength) => {
        console.log("Set playing song > ")
        this.lastPlayedSong = {
            url: url,
            player: player,
            name: name,
            length: audioLength
        }
        console.log("Playing > ")
        console.log(this.lastPlayedSong)
        console.log("end  ")
    }

    addSong = (url, playerName, songName, audioLength) => {

        if (this.songQueue.length >= MAX_VIDEOS_IN_QUEUE) {
            console.log("Queue is too full")
        } else {
            const newSong = {
                url: url,
                playerName: playerName,
                name: songName,
                length: audioLength,
                position: this.getSize()
            }

            
            console.log("Adding...")
            console.log(newSong)
            
            this.songQueue.push(newSong)
            this.queueOutdated = true
        }
    }

    removeSong = () => {

        console.log("Removing song... ")

        let result = {}

        if (!this.isEmpty()) {

            let returl = this.songQueue[0].url
            let songName = this.songQueue[0].name
            let playerName = this.songQueue[0].playerName
            let audioLength = this.songQueue[0].length
            result = {
                url: returl,
                name: songName,
                player: playerName,
                length: audioLength
            }

            console.log("Removing >")
            console.log(result)
        }

        if (this.loopQueue)
            this.addSong(this.lastPlayedSong.url, this.lastPlayedSong.player, this.lastPlayedSong.name, this.lastPlayedSong.length)

        if (Object.keys(result).length > 0) {
            this.songQueue.shift()
            console.log("Popping > ")
        } else {
            console.log("Queue empty")
        }
        this.queueOutdated = true

        return result
    }

    isLoop = () => this.loopSong

    isLoopQueue = () => this.loopQueue

    toggleLoop = () => {
        this.loopSong = !this.loopSong
        return this.loopSong
    }

    toggleLoopQueue = () => {
        this.loopQueue = !this.loopQueue
        return this.loopQueue
    }

    isPlaying = () => this.isPlayingFlag

    queueViewComponents = () => {
        const queueSize = this.displayQueue.length
        const endIndex = this.numQueueItemsShow + this.topOfQueue

        const components = []

        const next = new ButtonBuilder()
            .setCustomId('next')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("➡️")

        const back = new ButtonBuilder()
            .setCustomId('back')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⬅️")

        let shortenedQueue = this.displayQueue.slice(this.topOfQueue, queueSize > endIndex ? endIndex : queueSize).map((song, index) => {
            return `${index + 1 + (this.topOfQueue)}. ${song.name}\n`;
        })

        const queueList = new EmbedBuilder()
            .setTitle(`Showing first ${this.numQueueItemsShow} songs out of ${queueSize} total... 🎶`)
            .setDescription(`\`${shortenedQueue.join('\n')}\``)
            .setColor(0x06402B)
            .setFooter({ text: `Max videos allowed in queue: ${MAX_VIDEOS_IN_QUEUE}` });

        if (this.topOfQueue != 0)
            components.push(back)
        if (endIndex < queueSize)
            components.push(next)

        let rowComponents = {}
        if (components.length > 0)
            rowComponents = new ActionRowBuilder().addComponents(...components)

        return { queueList, rowComponents }

    }

    Queue = () => this.songQueue

    isTooFull = () => this.songQueue.length >= MAX_VIDEOS_IN_QUEUE
}

module.exports = {
    SongQueue,
    MAX_VIDEOS_IN_QUEUE
};