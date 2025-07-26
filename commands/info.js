const { SlashCommandBuilder } = require('discord.js')
const { EmbedBuilder } = require('discord.js');
const { guildPlaySessions } = require('./utils/playsession');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows information for playing song.'),
    async execute(interaction) {

        const session = guildPlaySessions.get(interaction.guild.id)

        if (!session)
            return interaction.reply("**❌ Session does not exist.**")

        const songQueue = session.GetQueue()

        const song = await songQueue.getPlayingInfo()

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