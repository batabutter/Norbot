const { SlashCommandBuilder } = require('discord.js')
const { songQueue, getSize, isEmpty } = require('../songqueue');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays current song queue'),
    async execute(interaction) {

        if (isEmpty())
            return interaction.reply("**Queue is empty. 🍃**")

        let shortenedQueue = songQueue.slice(0, getSize() > 5 ? 5 : getSize()).map((song, index) => {
            return `**${index + 1}.** ${song.name}`;
        })

        const queueList = new EmbedBuilder()
            .setTitle(`Showing 5 songs out of ${getSize()} total... 🎶`)
            .setDescription(`\`${shortenedQueue.join('\n')}\``)  // Join the songs with a line break
            .setColor(0x06402B);

       

        return interaction.reply({ embeds: [queueList] });


    }
}