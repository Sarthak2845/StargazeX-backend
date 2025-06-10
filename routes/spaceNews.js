const express = require('express');
const router = express.Router();
const axios = require('axios');

const CACHE_TTL = 60 * 1000; // 1 minute
let cache = { timestamp: 0, data: [] };

router.get('/', async (req, res) => {
  const now = Date.now();

  // Serve from cache if it's still valid
  if (now - cache.timestamp < CACHE_TTL && cache.data.length > 0) {
    return res.json(cache.data);
  }

  try {
    // Fetch total count first to calculate random offset
    const { data: meta } = await axios.get('https://api.spaceflightnewsapi.net/v4/articles');
    const total = meta.count;

    // Calculate a random offset
    const limit = 10;
    const maxOffset = total - limit;
    const offset = Math.floor(Math.random() * (maxOffset + 1));

    // Fetch a random set of articles
    const { data } = await axios.get('https://api.spaceflightnewsapi.net/v4/articles', {
      params: { limit, offset }
    });

    // Update cache
    cache = {
      timestamp: now,
      data: data.results
    };

    res.json(data.results);
  } catch (err) {
    console.error('News fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;
