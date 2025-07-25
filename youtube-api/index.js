require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express')
const axios = require('axios');

const app = express()
const port = 3000
const baseUrl = "https://www.googleapis.com/youtube/v3"
const watchUrl = "https://www.youtube.com/watch?v="

app.get('/', (req, res) => {
    res.json("Hello world")
})

app.get("/search/:searchQuery", async (req, res) => {

    try {

        const { searchQuery } = req.params
        const url = `${baseUrl}/search?key=${process.env.API_KEY}&part=snippet&type=video&q=${searchQuery}&maxResults=1`
        const response = await axios.get(url)

        if (!response.data || !response.data.items || response.data.items.length === 0)
            return res.status(404).json({ error: "No results found" });


        const videoUrls = response.data.items.map(item => {
            const videoId = item.id.videoId
            return `${watchUrl}${videoId}`
        })


        res.send(videoUrls)

    } catch (error) {
        console.log(error.message)
    }
})

app.listen(port, () => {
    console.log(`Started YouTubeAPI entry on localhost:${port}`)
})