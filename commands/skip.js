const { SlashCommandBuilder } = require('discord.js')
const { getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const { checkConnection } = require('./utils/checkvoiceconnection');
const { guildPlaySessions } = require('./utils/sessionmap');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip current song in queue'),
    async execute(interaction) {

        let session = guildPlaySessions.get(interaction.guild.id)

        const validConnection = await checkConnection(interaction, session)

        if (validConnection) {
            
            const songQueue = session.GetQueue()

            songQueue.setQueueOutdated(true)
            songQueue.isPlayingFlagToggle(false)

            const player = session.GetPlayer()

            player.on(AudioPlayerStatus.Playing, () => {
                console.log('The audio player has started playing!');
            });

            if (!player) {
                return interaction.reply("No active player found.");
            }

            player.stop()
            return await interaction.reply("** Song skipped! **⏭️")
        }
    }
}