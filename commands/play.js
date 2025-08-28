const { SlashCommandBuilder } = require('discord.js')
const { createAudioPlayer, joinVoiceChannel, NoSubscriberBehavior } = require('@discordjs/voice');
const { PlaySession } = require('./utils/playsession');
const { guildPlaySessions } = require('./utils/sessionmap');

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
        try {

            for (let c of interaction.options.getString('input').toLowerCase())
                if (c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126)
                    throw new Error("❌ Please make sure to enter an input using only alphanumeric characters.")


            if (interaction.options.getString('input') == "" || interaction.options.getString('input') == null)
                throw new Error("❌ Bad input.")

            if (!interaction.member.voice.channel) {
                throw new Error("❓ You're not connected to any voice channel.")
            }

            await interaction.deferReply();
            const botPermissions = interaction.member.voice.channel.permissionsFor(interaction.guild.members.me);
            let session = guildPlaySessions.get(interaction.guild.id)
            console.log("ID is currently > " + interaction.guild.id)

            if (!botPermissions || !botPermissions.has(['Connect', 'Speak']))
                throw new Error(`❌ Please make sure Norbot has the required permissions to join.`)

            if (!session || session.channelId !== interaction.member.voice.channel.id) {

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
            console.log("Current session > " + session)
            console.log("Numer of sessions > " + guildPlaySessions.size)
            /**
             * Start Playing logic > 
             */
            if (songQueue.getLoadingSongs())
                throw new Error(`❌ Please wait until all the songs have been loaded into the queue to queue a new song.`)

            songQueue.setForceStop(false)
            session.SetInteraction(interaction)

            await session.PlayNextResource(interaction.options.getString('input'))

        } catch (error) {
            if (interaction.deferred || interaction.replied)
                await interaction.editReply(`**❗Something went wrong... ${error.message}**`)
            else
                await interaction.reply(`**❗Something went wrong... ${error.message}**`);

        }

    }

}