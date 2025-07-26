const { SlashCommandBuilder } = require('discord.js')
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows list of commands.'),
    async execute(interaction) {

        const help = new EmbedBuilder()
            .setTitle(`List of commands for **Norbot:**`)
            .setDescription(`
                \`/help\` : Shows the list of available commands\n\n`+
                `\`/play [input]\` Play an MP3 by searching YouTube with either a URL or a query\n`+
                `\`/skip\` Skips the current track\n`+
                `\`/loop\` Loops the current track\n\n`+
                `\`/loopqueue\` Loops the entire queue\n`+
                `\`/queue\` Shows the current songs in the queue\n`+
                `\`/clear\` Clears the queue\n`+
                `\`/remove [input]\` Removes a track from the queue at the given position\n`+
                `\n**Please let me know if there are any bugs!**`)
            .setColor(0x06402B);

        return interaction.reply({ embeds: [help] });


    }

}