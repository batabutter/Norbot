const { SlashCommandBuilder } = require('discord.js')
const { songQueue, getSize, isEmpty, getPlayingInfo } = require('../songqueue');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows information for playing song.'),
    async execute(interaction) {

        const song = await getPlayingInfo()

        if (!song || Object.keys(song).length === 0)
            return interaction.reply("**No song is currently playing. 🍃**")

        console.log(song)

        const help = new EmbedBuilder()
            .setTitle(`**💽 Now playing:**`)
            .setDescription(`**${song.name}\n\n**`+
                `\`Played by: ${song.player}\``)
            .setColor(0x06402B);

        return interaction.reply({ embeds: [help] });
    }

}