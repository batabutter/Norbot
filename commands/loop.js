const { SlashCommandBuilder } = require('discord.js')
const { toggleLoop } = require('../songqueue');
const { checkConnection } = require('./utils/checkvoiceconnection');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggles the loop for the current song'),
    async execute(interaction) {

        const validConnection = await checkConnection(interaction)

        if (validConnection) {
            const loop = toggleLoop()

            const result = loop ? "on" : "off"

            return interaction.reply(`**Loop is ${result}. **🔁`)
        }

    }
}