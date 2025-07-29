const { SlashCommandBuilder } = require('discord.js')
const { createAudioPlayer, joinVoiceChannel, NoSubscriberBehavior } = require('@discordjs/voice');
const { PlaySession, guildPlaySessions } = require('./utils/playsession');

/*

    Check difference between url and regular input

*/

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays audio from a YouTube URL.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription(`Please enter a url or a video title.`)
                .setRequired(true)
        ),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply("**❓ You're not connected to any voice channel.**")
        }
        await interaction.deferReply();
        try {

            const botPermissions = interaction.member.voice.channel.permissionsFor(interaction.guild.members.me);
            let session = guildPlaySessions.get(interaction.guild.id)

            if (!botPermissions || !botPermissions.has(['Connect', 'Speak']))
                return interaction.editReply(`❗ **Something went wrong when joining... Please make sure Norbot has the required permissions to join.**`)

            if (!session) {

                console.log("In a new session")

                const tempConnection = joinVoiceChannel({
                    channelId: interaction.member.voice.channel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                })

                const tempPlayer = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Pause,
                    },
                })

                session = new PlaySession(interaction.member.voice.channel.id,
                    tempConnection,
                    tempPlayer,
                    tempConnection.subscribe(tempPlayer),
                    interaction
                )

                guildPlaySessions.set(interaction.guild.id, session)
            }

            /**
             * Create Connection and player
             */
            const songQueue = session.GetQueue()
            /**
             * Start Playing logic > 
             */
            if (songQueue.getLoadingSongs())
                return await interaction.editReply(`**❌ Please wait until all the songs have been loaded into the queue to queue a new song.**`)

             session.SetInteraction(interaction)

            await session.PlayNextResource(interaction.options.getString('input'))

        } catch (error) {
            await interaction.editReply(`❗ **Something went wrong... ** \`${error.message}\``)
        }

    }

}