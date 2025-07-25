const { SlashCommandBuilder } = require('discord.js')
const { isEmpty, clearQueue } = require('../songqueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the queue.'),
    async execute(interaction) {

        if (isEmpty())
            return interaction.reply("**Queue is already empty. 🍃**")
        
        clearQueue()

        return interaction.reply("**Queue cleared. **✅");
    }
}