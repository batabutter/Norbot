const { SlashCommandBuilder } = require('discord.js')
const { toggleLoopQueue } = require('../songqueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loopqueue')
        .setDescription('Toggles the loop for the entire queue'),
    async execute(interaction) {

        const loop = toggleLoopQueue()

        const result = loop ? "on" : "off"

        return interaction.reply(`**LoopQueue is ${result}. **🔁`)
    }
}