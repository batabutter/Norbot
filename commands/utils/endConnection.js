const { getVoiceConnection } = require('@discordjs/voice');
const { guildPlaySessions } = require('./playsession');

module.exports = {
    async clearConnection(connection, player, interaction, subscription, songQueue) {

        console.log("Trying....")
        songQueue.clearQueue()
        songQueue.setQueueOutdated(true)
        songQueue.isPlayingFlagToggle(false)
        songQueue.setForceStop(false)
        songQueue.setLoadingSongs(false)

        if (subscription)
            subscription.unsubscribe(player)

        connection.destroy()

        if (guildPlaySessions && guildPlaySessions.get(interaction.guild.id)) {
            guildPlaySessions.delete(interaction.guild.id)
            console.log("Deleted the id")
        }
    }
}