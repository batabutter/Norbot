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
    addSong } = require('../songqueue');

const filePath = path.resolve(__dirname, 'audio.mp3');

/*

    Check difference between url and regular input

*/

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Replies with Pong and latency information')
        .addStringOption(option =>
            option.setName('input')
                .setDescription(`Video title`)
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        let url = interaction.options.getString('input')

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        try {

            if (!ytdl.validateURL(url))
                return interaction.editReply("**❌ Could not find a video with that url.**")

            let info = await ytdl.getBasicInfo(url)

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
                    ` Enqueued **\"${info.videoDetails.title}\"** at queue position ${getSize() - 1}`)
            }

            player.on(AudioPlayerStatus.Idle, async () => {
                console.log("Free to play a song")

                if (!isEmpty()) {
                    const content = removeSong();
                    info = await ytdl.getBasicInfo(content.url)
                    playNextResource(url, player, connection)
                    return interaction.channel.send(`Now playing: **\"${content.name}\"** in **${interaction.member.voice.channel.name}** 🔊`);
                }
                else {
                    isPlayingFlagToggle(false)
                    return interaction.channel.send(`** Player stopped. ** ⏹️`);
                }
            });

            console.log("Url is now " + url)

            playNextResource(url, player, connection)

            connection.on(VoiceConnectionStatus.Destroyed, async (oldState, newState) => {
                try {
                    console.log("Broken?")
                } catch (error) {
                    console.log(error.message)
                }
            })

            await interaction.editReply(`Now playing: **\"${info.videoDetails.title}\"** in **${interaction.member.voice.channel.name}** 🔊`);



        } catch (error) {
            console.log(error.message)
        }
    }
}

const playNextResource = async (url, player, connection) => {
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

}