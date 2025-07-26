const { SlashCommandBuilder } = require('discord.js')
const { toggleLoopQueue } = require('../songqueue');
const { checkConnection } = require('./utils/checkvoiceconnection');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loopqueue')
        .setDescription('Toggles the loop for the entire queue'),
    async execute(interaction) {

        const validConnection = checkConnection()

        if (validConnection) {
            try {
                const loop = toggleLoopQueue()

                const result = loop ? "on" : "off"

                return interaction.reply(`**LoopQueue is ${result}. **🔁`)
            } catch (error) {
                console.log("Loop error: "+error.message)
            }
        }
    }
}