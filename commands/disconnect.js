const { SlashCommandBuilder } = require('discord.js')
const { getVoiceConnection } = require('@discordjs/voice');
const { guildPlaySessions } = require('./utils/playsession');
const { clearConnection } = require('./utils/endConnection');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Disconnect from vc'),
    async execute(interaction) {

        const session = guildPlaySessions.get(interaction.guild.id)

        if (!session)
            return interaction.reply("**❌ No voice channel connected to...**")

        console.log("Valid here > "+guildPlaySessions)

        clearConnection(session.GetConnection(), session.GetPlayer(), 
            interaction, session.GetSubscription(), session.GetQueue())
    }
}