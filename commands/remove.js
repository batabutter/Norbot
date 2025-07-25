const { SlashCommandBuilder } = require('discord.js')
const { songQueue, isEmpty } = require('../songqueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Clears the queue.')
        .addStringOption(option =>
            option.setName('position')
                .setDescription(`Please enter a position to remove.`)
                .setRequired(true)
        ),
    async execute(interaction) {

        if (isEmpty())
            return interaction.reply("**Queue is already empty. 🍃**")

        const result = removeSongAtPositon()

        return interaction.reply(result ? "**Position removed cleared. **✅" : 
            "**❌ Invalid position. Please specify a position within the queue.**"
        );
    }
}