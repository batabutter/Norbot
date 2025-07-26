const { SlashCommandBuilder } = require('discord.js')
const { checkConnection } = require('./utils/checkvoiceconnection');
const { guildPlaySessions } = require('./utils/playsession');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the queue.'),
    async execute(interaction) {
        
        const session = guildPlaySessions.get(interaction.guild.id)

        const validConnection = await checkConnection(interaction, session)

        const songQueue = session.GetQueue()

        if (validConnection) {
            if (songQueue.isEmpty())
                return interaction.reply("**Queue is already empty. 🍃**")

            songQueue.clearQueue()

            return interaction.reply("**Queue cleared. **✅");
        }
    }
}