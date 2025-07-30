const { SlashCommandBuilder } = require('discord.js')
const { checkConnection } = require('./utils/checkvoiceconnection');
const { guildPlaySessions } = require('./utils/sessionmap');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loopqueue')
        .setDescription('Toggles the loop for the entire queue'),
    async execute(interaction) {
        const session = guildPlaySessions.get(interaction.guild.id)

        const validConnection = await checkConnection(interaction, session)

        if (validConnection) { 

            const songQueue = session.GetQueue()
            try {
                const loop = songQueue.toggleLoopQueue()

                const result = loop ? "on" : "off"

                return interaction.reply(`**LoopQueue is ${result}. **🔁`)
            } catch (error) {
                console.log("Loop error: " + error.message)
            }
        }
    }
}