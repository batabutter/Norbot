const { SlashCommandBuilder } = require('discord.js')
const { getVoiceConnection } = require('@discordjs/voice');
const { guildPlaySessions } = require('./utils/playsession');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Disconnect from vc'),
    async execute(interaction) {

        const session = guildPlaySessions.get(interaction.guild.id)

        if (!session)
            return interaction.reply("**❌ No voice channel connected to...**")

        const songQueue = session.GetQueue()

        const connection = getVoiceConnection(interaction.guild.id);
        songQueue.clearQueue()
        songQueue.setQueueOutdated(true)

        connection.destroy();

        await interaction.reply({
            content: "**Disconnecting... ✅**",
            fetchReply: true
        })
    }
}