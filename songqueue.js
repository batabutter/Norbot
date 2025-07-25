let songQueue = []
let isPlayingFlag = false
let loopSong = false
let loopQueue = false
let lastPlayedSong = {}

const clearQueue = () => {
    songQueue = []
}

const removeSongAtPositon = (position) => {
    let result = false
    if (position > 0 && position < songQueue.length) {
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
}

const removeSong = () => {

    console.log("Removing song... "+loopQueue)

    let result = {}

    if (!isEmpty()) {

        let returl = songQueue[0].url
        let songName = songQueue[0].name
        let playerName = songQueue[0].playerName
        result= {
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

module.exports = {
    songQueue,
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
    setPlayingSong
};