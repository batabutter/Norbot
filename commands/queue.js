const { SlashCommandBuilder } = require('discord.js')
const { checkConnection } = require('./utils/checkvoiceconnection');
const { guildPlaySessions } = require('./utils/playsession');
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
            songQueue.setQueueOutdated(false)

            if (songQueue.isEmpty())
                return interaction.reply("**Queue is empty. 🍃**")

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