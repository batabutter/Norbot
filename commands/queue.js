const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { checkConnection } = require('./utils/checkvoiceconnection');
const { guildPlaySessions } = require('./utils/sessionmap');
const activeQueue = new Map()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays current song queue'),
    async execute(interaction) {

        const session = guildPlaySessions.get(interaction.guild.id)

        const validConnection = await checkConnection(interaction, session)
        if (validConnection) {
            const songQueue = session.GetQueue()

            if (songQueue.getLoadingSongs())
                return await interaction.reply(`**❌ Please wait until all the songs have been loaded into the queue to display the queue**`)
            
            songQueue.setQueueOutdated(false)

            if (songQueue.isEmpty())
                return await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`**Queue is empty 🍃**`)
                        .setColor(0x06402B)
                        .setFooter({ text: `Loop: ${songQueue.isLoop() ? `✅` : `❌`} LoopQueue: ${songQueue.isLoopQueue() ? `✅` : `❌`}` })]
                });

            songQueue.setDisplayQueue([...songQueue.Queue()])

            const { queueList, rowComponents } = songQueue.queueViewComponents()

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