const songQueue = []
let isPlayingFlag = false

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
        songQueue.pop()
        console.log("Popping > "+returl)
        return {
            url: returl,
            name: songName
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
    addSong
};