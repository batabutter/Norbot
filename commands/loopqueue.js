const { SlashCommandBuilder } = require('discord.js')
const { checkConnection } = require('./utils/checkvoiceconnection');
const { guildPlaySessions } = require('./utils/playsession');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loopqueue')
        .setDescription('Toggles the loop for the entire queue'),
    async execute(interaction) {
        const session = guildPlaySessions.get(interaction.guild.id)

        const validConnection = checkConnection(interaction, session)

        const songQueue = session.GetQueue()

        if (validConnection) {
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