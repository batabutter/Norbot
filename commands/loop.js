const { SlashCommandBuilder } = require('discord.js')
const { toggleLoop } = require('../songqueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggles the loop for the current song'),
    async execute(interaction) {

        const loop = toggleLoop()

        const result = loop ? "on" : "off"

        return interaction.reply(`**Loop is ${result}. **🔁`)
    }
}