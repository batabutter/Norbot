const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js')
const { songQueue, isEmpty, setDisplayQueue, queueViewComponents, getTopOfQueue, getNumQueueItemsToDisplay, setQueueOutdated } = require('../songqueue');
const { EmbedBuilder } = require('discord.js');
const { checkConnection } = require('./utils/checkvoiceconnection');
const activeQueue = new Map()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays current song queue'),
    async execute(interaction) {

        const validConnection = await checkConnection(interaction)

        if (validConnection) {
            setQueueOutdated(false)

            setDisplayQueue([...songQueue])

            if (isEmpty())
                return interaction.reply("**Queue is empty. 🍃**")

            const { queueList, rowComponents } = queueViewComponents()

            let res

            if (Object.keys(rowComponents).length > 0)
                res = await interaction.reply({
                    embeds: [queueList], components: [rowComponents],
                    fetchReply: true
                });
            else
                res = await interaction.reply({
                    embeds: [queueList]
                });

            activeQueue.set("id", res.id)


            return res
        }
    },
    activeQueue
}