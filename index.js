const {
    Client,
    Events,
    GatewayIntentBits,
    Partials,
    Collection,
    REST,
    Routes,
    PresenceUpdateStatus,
    ActivityType } = require('discord.js');
const fs = require('fs')
const path = require('path')
const { token } = require('./config.json');
const { activeQueue } = require('./commands/queue');
const { guildPlaySessions } = require('./commands/utils/playsession');
require('dotenv').config()

const setupDatabase = async () => {
    try {

    } catch (error) {

    }
}

const deployCommands = async () => {
    try {
        const commands = []

        const commandFiles = fs.readdirSync(path.join(__dirname, 'commands'))
            .filter(file => file.endsWith('.js'))

        for (const file of commandFiles) {
            const command = require(`./commands/${file}`)
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON())
            } else {
                console.log(`Warning: The command at ${file} is missing ` +
                    `a required 'data' or 'execute' property.`)
            }
        }
        const rest = new REST().setToken(token)

        console.log(`Started refreshing ${commands.length} application slash` +
            ` commands`)

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        )

        console.log("Successfully reloaded all commands!")
    } catch (error) {
        console.log(`Error reloading commands ${error}`)
    }
}


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
    ]
});

client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
    } else {
        console.log(`The command ${filePath} is missing with required "data" ` +
            `or execute property.`)
    }
}


client.once(Events.ClientReady, async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`)

    await deployCommands()
    console.log(`Commands deployed globaly.`)

    const status = 'online'
    const activityType = `PLAYING`
    const activityName = `gleefully`

    client.user.setPresence({
        status: PresenceUpdateStatus.Online,
        activities: [{
            name: activityName,
            type: ActivityType.Playing
        }]
    })

    client.user.setStatus(status)


    console.log(`Bot is ${status} ${activityType} ${activityName}`)

})

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName)

        if (!command) {
            console.error(`No command matching ${interaction.commandName} found`)
            return
        }

        try {
            await command.execute(interaction)
        } catch (error) {
            console.log(error.message)
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "There was an error executing this command",
                    ephemeral: true
                })
            } else {
                await interaction.reply({
                    content: "There was an error executing this command",
                    ephemeral: true
                })
            }
        }
    } else if (interaction.isButton()) {
        const currentQueueMessageId = activeQueue.get("id")
        const session = guildPlaySessions.get(interaction.guild.id)

        if (session) {
            const songQueue = session.GetQueue()
            if (interaction.message.id !== currentQueueMessageId || songQueue.isQueueOutdated())
                return interaction.reply("**❌ Queue is outdated. Please call `/queue` again **");

            if (interaction.customId === 'next') {
                let queueSize = songQueue.getDisplayQueueSize()
                let numQueueItems = songQueue.getNumQueueItemsToDisplay()
                let topOfQueue = songQueue.getTopOfQueue()
                if (queueSize > (topOfQueue + numQueueItems)) {
                    songQueue.setTopOfQueue(topOfQueue + numQueueItems)
                    const { queueList, rowComponents} = songQueue.queueViewComponents()
                    await interaction.update({ embeds: [queueList], components: [rowComponents] });
                }
            } else if (interaction.customId === 'back') {
                let numQueueItems = songQueue.getNumQueueItemsToDisplay()
                let topOfQueue = songQueue.getTopOfQueue()
                if ((topOfQueue - numQueueItems) >= 0) {
                    songQueue.setTopOfQueue(topOfQueue - numQueueItems)
                    const { queueList, rowComponents} = songQueue.queueViewComponents()
                    await interaction.update({ embeds: [queueList], components: [rowComponents] });
                }
            }
        } else {
            await interaction.update("❓ **Session does not exist**");
        }
    }
})


client.login(token);