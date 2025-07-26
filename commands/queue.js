const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js')
const { songQueue, isEmpty, setDisplayQueue, queueViewComponents, getTopOfQueue, getNumQueueItemsToDisplay, setQueueOutdated } = require('../songqueue');
const { EmbedBuilder } = require('discord.js');
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

            const res = await interaction.reply({
                embeds: [queueList], components: [rowComponents],
                fetchReply: true
            });

            activeQueue.set("id", res.id)


            return res
        }
    },
    activeQueue
}