const { SlashCommandBuilder } = require('discord.js')
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Replies with Pong and latency information')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The voice channel to join')
                .setRequired(true)
                .addChannelTypes(2)
        ),
    async execute(interaction) {
        try {
            const sent = await interaction.reply({
                content: "Joining...",
                fetchReply: true
            })
            const voiceChannel = interaction.options.getChannel('channel')

            if (voiceChannel == null)
                await interaction.editReply(`Please give a channel name `)
            else {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
                await interaction.reply(`Joined.`)
            }

        } catch (error) {
            console.error(`Error joining voice ${error}`)
        }
    }
}