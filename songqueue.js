const songQueue = []
let isPlayingFlag = false
let loopSong = false
let loopQueue = false

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

const addSong = (url, playerName, songName) => {
    const newSong = {
        url: url,
        playerName: playerName,
        name: songName,
        position: getSize()
    }
    songQueue.push(newSong)
}

const removeSong = () => {
    if (!isEmpty()) {
        let returl = songQueue[0].url
        let songName = songQueue[0].name
        let playerName = songQueue[0].playerName

        songQueue.pop()
        if (!loopQueue) {
            console.log("Popping > " + returl)
        } else {
            console.log("Loop queue is on!")
            console.log("Adding song back to bottom of the queue...")
            addSong(returl, songName, playerName)
        }
        return {
            url: returl,
            name: songName,
            player: playerName
        }
    }
    console.log("Queue empty")
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
    removeSongAtPositon
};