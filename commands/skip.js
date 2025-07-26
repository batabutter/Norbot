const { SlashCommandBuilder } = require('discord.js')
const { getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const {
    songQueue,
    getSize,
    isEmpty,
    setQueueOutdated
} = require('../songqueue');
const { checkConnection } = require('./utils/checkvoiceconnection');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip current song in queue'),
    async execute(interaction) {

        const validConnection = await checkConnection(interaction)

        if (validConnection) {
            const connection = getVoiceConnection(interaction.guild.id);

            setQueueOutdated(true)

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
}