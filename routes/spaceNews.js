const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  try {
    const { data } = await axios.get('https://api.spaceflightnewsapi.net/v4/articles', {
      params: { limit: 10 }
    });
    res.json(data.results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;
