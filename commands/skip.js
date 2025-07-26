const { SlashCommandBuilder } = require('discord.js')
const { getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const { checkConnection } = require('./utils/checkvoiceconnection');
const { guildPlaySessions } = require('./utils/playsession');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip current song in queue'),
    async execute(interaction) {

        let session = guildPlaySessions.get(interaction.guild.id)

        const validConnection = await checkConnection(interaction, session)

        const songQueue = session.GetQueue()

        if (validConnection) {

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
            await interaction.reply("** Song skipped! **⏭️")
        }
    }
}