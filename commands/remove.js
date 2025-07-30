const { SlashCommandBuilder } = require('discord.js')
const { checkConnection } = require('./utils/checkvoiceconnection');
const { guildPlaySessions } = require('./utils/sessionmap');

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
        let session = guildPlaySessions.get(interaction.guild.id)

        const validconnection = await checkConnection(interaction, session)


        if (validconnection) {
            const songQueue = session.GetQueue()

            if (songQueue.getLoadingSongs())
                return await interaction.reply(`**❌ Please wait until all the songs have been loaded into the queue to remove a song**`)

            const position = interaction.options.getInteger('position')

            if (songQueue.isEmpty())
                return interaction.reply("**Queue is already empty. 🍃**")

            const result = songQueue.removeSongAtPositon(position - 1)

            return interaction.reply(result ? "**Position removed. **✅" :
                "**❌ Invalid position. Please specify a position within the queue.**"
            );
        }
    }
}