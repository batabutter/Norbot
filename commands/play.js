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
    setPlayingSong
} = require('../songqueue');

const filePath = path.resolve(__dirname, 'audio.mp3');

const baseUrl = "http://localhost:3000/search/"
const playlistURL = "http://localhost:3000/playlist/items/"
const maxVideoLength = 7200


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

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        try {
            let url = await validateUrl(interaction.options.getString('input'), interaction.user.tag)

            console.log("Outside validation: " + url)

            let info = await ytdl.getBasicInfo(url)
            if (info.videoDetails.lengthSeconds > maxVideoLength)
                return interaction.editReply("**❌ This video is too long! I can only play videos under 2 hours in length.**")

            connection.on('stateChange', (oldState, newState) => {
                console.log(`Connection state changed from ${oldState.status} to ${newState.status}`);
            });

            connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                try {
                    console.log("Destroying connection")
                    connection.destroy()
                } catch (error) {
                    console.log(error.message)
                }
            })


            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });

            if (isPlaying()) {
                addSong(url, interaction.user.tag, info.videoDetails.title)
                return interaction.editReply(
                    `Queued **\"${info.videoDetails.title}\"** at position **${getSize()}**. 🎵`)
            }

            player.on(AudioPlayerStatus.Idle, async () => {
                console.log("Free to play a song")

                if (!isEmpty() || isLoop() || isLoopQueue()) {
                    const content = isLoop() ? { url: url, name: info.videoDetails.title, player: interaction.user.tag } : removeSong();

                    playNextResource(content.url, player, connection, content.player, content.name)
                    if (isLoop() || isLoopQueue())
                        return
                    return interaction.channel.send(`Now playing: **\"${content.name}\"** in **${interaction.member.voice.channel.name}**. 🔊`);
                } else {
                    isPlayingFlagToggle(false)
                    return interaction.channel.send(`** Player stopped. ** ⏹️`);
                }
            });

            console.log("Url is now " + url)

            playNextResource(url, player, connection, interaction.user.tag, info.videoDetails.title)

            connection.on(VoiceConnectionStatus.Destroyed, async (oldState, newState) => {
                try {
                    console.log("Broken?")
                } catch (error) {
                    console.log(error.message)
                }
            })
            if (isEmpty())
                await interaction.editReply(`Now playing: **\"${info.videoDetails.title}\"** in **${interaction.member.voice.channel.name}**. 🔊`)
            else {
                await interaction.editReply(`Now playing: **\"${info.videoDetails.title}\"** in **${interaction.member.voice.channel.name}, Queued ${getSize()} songs**. 🔊`)
            }

        } catch (error) {
            console.log(error.message)
        }
    }
}

const playNextResource = async (url, player, connection, username, title) => {
    const stream = await ytdl(url, { filter: 'audioonly' })
        .pipe(require("fs")
            .createWriteStream(filePath));

    stream.on("finish", () => {
        console.log("finished downloading")
        const resource = createAudioResource(filePath);
        player.play(resource);
        connection.subscribe(player);
        isPlayingFlagToggle(true)
        return resource
    })

    setPlayingSong(url, username, title)
}

const validateUrl = async (url, playerName) => {
    let retUrl = ""
    if (!ytdl.validateURL(url)) {
        try {
            const res = await fetch(`${baseUrl}${url}`)
            const json = await res.json()
            if (!res.ok)
                return interaction.editReply("**❌ Could not find a video with that url or title.**")
            retUrl = json[0]
            console.log("Trying with > " + retUrl)
        } catch (error) {
            console.log(error.message)
        }
    } else {
        const parsedURL = new URL(url)
        const listId = parsedURL.searchParams.get("list")
        let listItems = []
        retUrl = url
        if (listId) {
            console.log("Playlisy??")
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
                    let info = await ytdl.getBasicInfo(itemURL)
                    await addSong(itemURL, playerName, info.videoDetails.title)
                }
            } catch (error) {
                console.log(error.message)
            }
        }
    }

    return retUrl
}