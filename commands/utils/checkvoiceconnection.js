const { getVoiceConnection } = require("@discordjs/voice")

module.exports = {

    async checkConnection(interaction, session) {

        if (!session) {
            await interaction.reply("**❌ I am not connected to a voice channel.**")
            return false
        }

        if (!interaction.member.voice.channel) {
            await interaction.reply("**❓ You're not connected to any voice channel.**")
            return false
        }

        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            await interaction.reply("**❌ I am not connected to a voice channel.**")
            return false
        }

        if (connection.joinConfig.channelId != interaction.member.voice.channelId) {
            await interaction.reply("**❌ You cannot skip from a different voice channel.**")
            return false
        }

        return true
    }

}