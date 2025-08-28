const { SlashCommandBuilder } = require('discord.js')
const { EmbedBuilder } = require('discord.js');
const { guildPlaySessions } = require('./utils/sessionmap');

const PROGRESS_BAR_SIZE = 20

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

        if (!songQueue.isPlaying() || !song || Object.keys(song).length === 0)
            return interaction.reply("**No song is currently playing. 🍃**")

        console.log(song)

        const lengthSeconds = session.GetCurrentTime()
        const endTime = session.GetEndTime()

        const formattedMinutes = String(Math.floor(lengthSeconds / 60))
        const formattedSeconds = String(Math.round((lengthSeconds % 60))).padStart(2, 0)

        const formattedMinutesEnd = String(Math.floor(endTime / 60))
        const formattedSecondsEnd = String(Math.round((endTime % 60))).padStart(2, 0)

        const help = new EmbedBuilder()
            .setTitle(`**💽 Now playing:**`)
            .setDescription(`**"${song.name}"**\n\n` +
                `${progressBar(lengthSeconds, endTime, PROGRESS_BAR_SIZE)}\n`+
                `[${formattedMinutes}:${formattedSeconds}/${formattedMinutesEnd}:${formattedSecondsEnd}]\n\n`+
                `\`Played by: ${song.player}\``)
            .setColor(0x06402B);

        return interaction.reply({ embeds: [help] });
    }

}

const progressBar = (currTime, endTime, size) => {
    const percent = currTime / endTime
    const fill = Math.floor(size * percent)
    const empty = size - fill

    const bar = `**|${'='.repeat(fill)}⚪${'-'.repeat(empty)}|**`;

    return bar
}