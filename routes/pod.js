const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    const apiKey = process.env.NASA_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'NASA API key is missing.' });
    }

    try {
        const response = await axios.get(`https://api.nasa.gov/planetary/apod`, {
            params: { api_key: apiKey }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from NASA API:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from NASA API.' });
    }
});

module.exports = router;
