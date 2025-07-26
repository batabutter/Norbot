const { SlashCommandBuilder } = require('discord.js')
const { createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
const ytdl = require("@distube/ytdl-core");
const {
    isEmpty,
    isPlayingFlagToggle,
    isPlaying,
    removeSong,
    getSize,
    addSong,
    isLoop,
    isLoopQueue,
    setPlayingSong,
    setQueueOutdated,
    clearQueue
} = require('../songqueue');

const filePath = path.resolve(__dirname, 'audio.mp3');

const baseUrl = "http://localhost:3000/search/"
const playlistURL = "http://localhost:3000/playlist/items/"
const maxVideoLength = 7200
let subscription = null

/*

    Check difference between url and regular input

*/

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays audio from a YouTube URL.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription(`Please enter a url or a video title.`)
                .setRequired(true)
        ),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply("**❓ You're not connected to any voice channel.**")
        }
        await interaction.deferReply();
        try {
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const botPermissions = interaction.member.voice.channel.permissionsFor(interaction.guild.members.me);

            if (!botPermissions || !botPermissions.has(['Connect', 'Speak']))
                return interaction.editReply(`❗ **Something went wrong when joining... Please make sure Norbot has the required permissions to join.**`)

            const { retUrl, numUnavailableSongs, numSongs } = await validateUrl(interaction.options.getString('input'), interaction.user.tag)
            let url = retUrl

            console.log("Outside validation: " + url)

            let info = await ytdl.getBasicInfo(url)
            const lengthSeconds = info.videoDetails.lengthSeconds
            if (lengthSeconds > maxVideoLength)
                return interaction.editReply("**❌ This video is too long! I can only play videos under 2 hours in length.**")

            connection.on('stateChange', (oldState, newState) => {
                console.log(`Connection state changed from ${oldState.status} to ${newState.status}`);
            });

            const formattedHours = String(Math.round(lengthSeconds / 3600)).padStart(2, 0)
            const formattedSeconds = String(Math.round((lengthSeconds % 3600) / 60)).padStart(2, 0)

            const audioLength = `[${formattedHours}:${formattedSeconds}]`

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });

            if (!subscription)
                subscription = connection.subscribe(player)

            connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                try {
                    endConnection(connection, subscription, player)
                    return interaction.editReply("**❌ Disconnected from VC**")
                } catch (error) {
                    console.log(error.message)
                }
            })

            connection.on(VoiceConnectionStatus.Destroyed, async (oldState, newState) => {
                try {
                    endConnection(connection, subscription, player)
                    console.log("Connection destroyed.")
                    return interaction.editReply("**❓ Something went wrong... Connection was destroyed.**")
                } catch (error) {
                    console.log(error.message)
                }
            })

            if (isPlaying()) {
                console.log("Why does thing is playing")
                addSong(url, interaction.user.tag, info.videoDetails.title)
                return interaction.editReply(
                    `** Queued ${numSongs} song${(numSongs > 1) ? "s" : ""}. ✅**` +
                    `${numUnavailableSongs ? `\n-# ❌ Unavailable songs: ${numUnavailableSongs}. ` : ""}`)
            }

            player.on(AudioPlayerStatus.Idle, async () => {
                console.log("Free to play a song")

                if (!isEmpty() || isLoop() || isLoopQueue()) {
                    const content = isLoop() ? { url: url, name: info.videoDetails.title, player: interaction.user.tag } : removeSong();

                    playNextResource(content.url, player, connection, content.player, content.name, subscription)
                    if (isLoop() || isLoopQueue())
                        return
                    return interaction.editReply(`Now playing: **\"${content.name}\"** ${audioLength}\nin \`${interaction.member.voice.channel.name}\`. 🔊`);
                } else {
                    isPlayingFlagToggle(false)
                    return interaction.channel.send(`** Player stopped. ** ⏹️`);
                }
            });

            console.log("Url is now " + url)

            playNextResource(url, player, connection, interaction.user.tag, info.videoDetails.title, subscription)

            if (isEmpty())
                await interaction.editReply(`Now playing: **\"${info.videoDetails.title}\"** ${audioLength}\nin \`${interaction.member.voice.channel.name}\`. 🔊`)
            else {
                await interaction.editReply(`Now playing: **\"${info.videoDetails.title}\"** ${audioLength}\nin \`${interaction.member.voice.channel.name}\` 🔊 \n-# Queued ${numSongs} songs. ✅` +
                    `${numUnavailableSongs ? `\n-# ❌ Unavailable songs: ${numUnavailableSongs}. ` : ""}`)
            }
        } catch (error) {
            await interaction.editReply(`❗ **Something went wrong... ** \`${error.message}\``)
        }

    }
}

const playNextResource = async (url, player, connection, username, title, subscription) => {
    const stream = await ytdl(url, { filter: 'audioonly' })
        .pipe(require("fs")
            .createWriteStream(filePath));

    stream.on("finish", () => {
        console.log("finished downloading")
        const resource = createAudioResource(filePath);
        player.play(resource);
        isPlayingFlagToggle(true)
        return resource
    })
    setQueueOutdated(true)
    setPlayingSong(url, username, title)
}

const validateUrl = async (url, playerName) => {
    let retUrl = ""
    let numUnavailableSongs = 0
    let numSongs = 0
    if (!ytdl.validateURL(url)) {
        try {
            const res = await fetch(`${baseUrl}${url}`)
            const json = await res.json()
            if (!res.ok)
                return interaction.editReply("**❌ Could not find a video with that url or title.**")
            retUrl = json[0]
            console.log("Trying with > " + retUrl)
            numSongs++;
        } catch (error) {
            console.log(error.message)
        }
    } else {
        const parsedURL = new URL(url)
        const listId = parsedURL.searchParams.get("list")
        let listItems = []
        retUrl = url
        if (listId) {
            console.log("Adding playlist > ")
            const index = parsedURL.searchParams.get("index")
            try {
                const res = await fetch(`${playlistURL}${listId}`)
                const json = await res.json()
                if (!res.ok)
                    return interaction.editReply("**❌ Error obtaining videos in the playlist**")
                listItems = json
                if (!isPlaying())
                    listItems.splice(index, 1);

                for (const itemURL of listItems) {
                    console.log("Validation complete")
                    try {
                        let info = await ytdl.getBasicInfo(itemURL)
                        if (info.videoDetails.lengthSeconds < maxVideoLength)
                            await addSong(itemURL, playerName, info.videoDetails.title)
                        numSongs++
                    } catch (error) {
                        console.log("Video unavailable")
                        numUnavailableSongs++
                    }
                }
            } catch (error) {
                console.log(error.message)
            }
        } else {
            numSongs++
        }
    }

    return { retUrl, numUnavailableSongs, numSongs }
}

const endConnection = (connection, subscription, player) => {

    console.log("Destroying connection by disconnecting")
    clearQueue()
    setQueueOutdated(true)
    isPlayingFlagToggle(false)
    if (subscription)
        subscription.unsubscribe(player)
    connection.destroy()

}