const { SlashCommandBuilder } = require('discord.js')
const { checkConnection } = require('./utils/checkvoiceconnection');
const { guildPlaySessions } = require('./utils/playsession');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggles the loop for the current song'),
    async execute(interaction) {
    
        const session = guildPlaySessions.get(interaction.guild.id)

        const validConnection = await checkConnection(interaction, session)
        
        const songQueue = session.GetQueue()

        if (validConnection) {
            const loop = songQueue.toggleLoop()

            const result = loop ? "on" : "off"

            return interaction.reply(`**Loop is ${result}. **🔁`)
        }

    }
}