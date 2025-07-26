const { ButtonBuilder, ActionRow, ActionRowBuilder, EmbedBuilder, ButtonStyle } = require("discord.js")

let songQueue = []
let isPlayingFlag = false
let loopSong = false
let loopQueue = false
let lastPlayedSong = {}
let displayQueue = []
let topOfQueue = 0
let numQueueItemsShow = 10
let queueOutdated = false

const clearQueue = () => { 
    songQueue = [] 
    queueOutdated = true
}

const setDisplayQueue = (queue) =>  { 
    displayQueue = queue
    topOfQueue = 0
    }

const getDisplayQueueSize = (queue) => displayQueue.length

const getTopOfQueue = () => topOfQueue

const setTopOfQueue = (value) => { topOfQueue = value }

const setQueueOutdated = (value) => { queueOutdated = value }

const isQueueOutdated = () => queueOutdated

const getPlayingInfo = () => lastPlayedSong


const getNumQueueItemsToDisplay = () => numQueueItemsShow

const removeSongAtPositon = (position) => {
    let result = false
    queueOutdated = true
    if (position >= 0 && position < songQueue.length) {
        songQueue.splice(position, 1)
        result = true
    } else {
        console.log(`Out of queue range! Cannot remove at position ${position}`)
    }

    return result
}

const isEmpty = () => {
    return songQueue.length == 0;
}

const getSize = () => {
    return songQueue.length
}

const isPlayingFlagToggle = (val) => {
    isPlayingFlag = val
}

const setPlayingSong = (url, player, name) => {
    console.log("Set playing song > ")
    lastPlayedSong = {
        url: url,
        player: player,
        name: name
    }
    console.log("Playing > ")
    console.log(lastPlayedSong)
    console.log("end  ")
}

const addSong = (url, playerName, songName) => {
    const newSong = {
        url: url,
        playerName: playerName,
        name: songName,
        position: getSize()
    }
    console.log("Adding...")
    console.log(newSong)
    songQueue.push(newSong)
    queueOutdated = true
}

const removeSong = () => {

    console.log("Removing song... " + loopQueue)

    let result = {}

    if (!isEmpty()) {

        let returl = songQueue[0].url
        let songName = songQueue[0].name
        let playerName = songQueue[0].playerName
        result = {
            url: returl,
            name: songName,
            player: playerName
        }
    }

    if (result) {
        songQueue.shift()
        console.log("Popping > ")
        if (loopQueue)
            addSong(lastPlayedSong.url, lastPlayedSong.player, lastPlayedSong.name)
    } else {
        console.log("Queue empty")
    }
    queueOutdated = true

    return result
}

const isLoop = () => {
    return loopSong
}

const isLoopQueue = () => {
    return loopQueue
}

const toggleLoop = () => {
    loopSong = !loopSong
    return loopSong
}

const toggleLoopQueue = () => {
    loopQueue = !loopQueue
    return loopQueue
}

const isPlaying = () => isPlayingFlag

const queueViewComponents = () => {
    const queueSize = displayQueue.length
    const endIndex = numQueueItemsShow+topOfQueue

    const components = []

    const next = new ButtonBuilder()
        .setCustomId('next')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("➡️")

    const back = new ButtonBuilder()
        .setCustomId('back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⬅️")

    let shortenedQueue = displayQueue.slice(topOfQueue, queueSize > endIndex ? endIndex : queueSize).map((song, index) => {
        return `${index + 1 + (topOfQueue)}. ${song.name}\n`;
    })

    console.log("Display queue >" )
    console.log(displayQueue)
    console.log("Short queue >" )
    console.log(shortenedQueue)

    const queueList = new EmbedBuilder()
        .setTitle(`Showing first ${numQueueItemsShow} songs out of ${queueSize} total... 🎶`)
        .setDescription(`\`${shortenedQueue.join('\n')}\``)
        .setColor(0x06402B)

    if (topOfQueue != 0)
        components.push(back)
    if (endIndex < queueSize)
        components.push(next)

    let rowComponents = {}
    if (components.length > 0)
        rowComponents = new ActionRowBuilder().addComponents(...components)

    return { queueList, rowComponents }

}

module.exports = {
    songQueue,
    displayQueue,
    isPlayingFlagToggle,
    isPlaying,
    isEmpty,
    getSize,
    removeSong,
    addSong,
    clearQueue,
    removeSongAtPositon,
    isLoop,
    isLoopQueue,
    toggleLoop,
    toggleLoopQueue,
    setPlayingSong,
    queueViewComponents,
    setDisplayQueue,
    getDisplayQueueSize,
    setTopOfQueue,
    getTopOfQueue,
    getNumQueueItemsToDisplay,
    setQueueOutdated,
    isQueueOutdated,
    getPlayingInfo,
};