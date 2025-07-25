const { SlashCommandBuilder } = require('discord.js')
const { songQueue, getSize, isEmpty } = require('../songqueue');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows list of commands.'),
    async execute(interaction) {

        const help = new EmbedBuilder()
            .setTitle(`List of commands for **Norbot:**`)
            .setDescription(`
                \`/help\` : Shows the list of available commands\n
                \`/play [input]\` Play an mp3 by searching YouTube with either a URL or a query
                \`/skip\` Skips the current track
                \`/loop\` Loops the current track\n
                \`/loopqueue\` Loops the entire queue
                \`/queue\` Shows the current songs in the queue\n\`/clear\` Clears the queue
                \`/remove [input]\` Removes a track from the queue at the given position\n 
                **Please let me know if there are any bugs that arise!**",`)
            .setColor(0x06402B);

        return interaction.reply({ embeds: [help] });


    }

}