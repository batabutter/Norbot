const { SlashCommandBuilder } = require('discord.js')
const { isEmpty, clearQueue, setQueueOutdated } = require('../songqueue');
const { checkConnection } = require('./utils/checkvoiceconnection');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the queue.'),
    async execute(interaction) {
        const validConnection = await checkConnection(interaction)

        if (validConnection) {
            if (isEmpty())
                return interaction.reply("**Queue is already empty. 🍃**")

            clearQueue()

            return interaction.reply("**Queue cleared. **✅");
        }
    }
}