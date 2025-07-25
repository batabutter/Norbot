const { SlashCommandBuilder } = require('discord.js')
const { songQueue, isEmpty, removeSongAtPositon } = require('../songqueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Clears the queue.')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position in the queue to remove')
                .setRequired(true)
        ),
    async execute(interaction) {

        const position = interaction.options.getInteger('position')

        if (isEmpty())
            return interaction.reply("**Queue is already empty. 🍃**")
    
        const result = removeSongAtPositon(position-1)

        return interaction.reply(result ? "**Position removed cleared. **✅" :
            "**❌ Invalid position. Please specify a position within the queue.**"
        );
    }
}