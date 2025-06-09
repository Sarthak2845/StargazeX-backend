const express = require('express');
const router = express.Router();
const { verifyToken } = require('./user');
const { getVisibleCelestialObjects, getUpcomingAstronomicalEvents } = require('../services/celestial');
const { getWeatherForecast } = require('../services/weather');

// Get celestial objects visible at a specific location and date
router.get('/visible-objects', async (req, res) => {
  try {
    const { date, location } = req.query;
    
    if (!date || !location) {
      return res.status(400).json({ error: 'Date and location are required' });
    }
    
    const celestialObjects = await getVisibleCelestialObjects(date, location);
    res.json(celestialObjects);
  } catch (error) {
    console.error('Get visible objects error:', error);
    res.status(500).json({ error: 'Failed to fetch celestial objects' });
  }
});

// Get upcoming astronomical events
router.get('/upcoming-events', async (req, res) => {
  try {
    const events = await getUpcomingAstronomicalEvents();
    res.json(events);
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// Get weather forecast for stargazing
router.get('/weather-forecast', async (req, res) => {
  try {
    const { date, location } = req.query;
    
    if (!date || !location) {
      return res.status(400).json({ error: 'Date and location are required' });
    }
    
    const forecast = await getWeatherForecast(location, date);
    res.json(forecast);
  } catch (error) {
    console.error('Get weather forecast error:', error);
    res.status(500).json({ error: 'Failed to fetch weather forecast' });
  }
});

// Get combined stargazing conditions (weather + celestial objects)
router.get('/stargazing-conditions', async (req, res) => {
  try {
    const { date, location } = req.query;
    
    if (!date || !location) {
      return res.status(400).json({ error: 'Date and location are required' });
    }
    
    // Get both weather and celestial data in parallel
    const [weather, celestialObjects] = await Promise.all([
      getWeatherForecast(location, date),
      getVisibleCelestialObjects(date, location)
    ]);
    
    // Calculate overall stargazing quality based on weather and celestial objects
    let stargazingQuality = 'Poor';
    if (weather.available && weather.forecast.stargazingQuality === 'Excellent' && celestialObjects.length > 2) {
      stargazingQuality = 'Excellent';
    } else if (weather.available && weather.forecast.stargazingQuality !== 'Poor') {
      stargazingQuality = 'Good';
    }
    
    res.json({
      date,
      location,
      weather,
      celestialObjects,
      stargazingQuality
    });
  } catch (error) {
    console.error('Get stargazing conditions error:', error);
    res.status(500).json({ error: 'Failed to fetch stargazing conditions' });
  }
});

module.exports = router;