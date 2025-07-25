const { SlashCommandBuilder } = require('discord.js')
const { getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const {
    songQueue,
    getSize,
    isEmpty
} = require('../songqueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip current song in queue'),
    async execute(interaction) {

        const connection = getVoiceConnection(interaction.guild.id);
        console.log(connection)

        if (!connection)
            return interaction.reply("**I am not connected to a voice channel.**")

        const player = connection.state.subscription?.player;

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('The audio player has started playing!');
        });

        if (!player) {
            return interaction.reply("No active player found.");
        }

        player.stop()
        await interaction.reply("** Song skipped! **⏭️")

    }
}