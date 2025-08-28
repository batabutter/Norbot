const { SlashCommandBuilder } = require('discord.js')
const { playSong } = require("./utils/playsong")


module.exports = {
    data: new SlashCommandBuilder()
        .setName('playnext')
        .setDescription('Plays audio from a YouTube URL.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription(`Please enter a url or a video title.`)
                .setRequired(true)
        ),
    async execute(interaction) {
        playSong(interaction, true)
    }
}