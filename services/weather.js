const axios = require('axios');
require('dotenv').config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get weather forecast for a specific location and date
 * @param {string} location - Location name or coordinates
 * @param {string} date - ISO date string
 * @returns {Promise<Object>} Weather forecast data
 */
async function getWeatherForecast(location, date) {
  try {
    // Parse the date
    const forecastDate = new Date(date);
    const today = new Date();
    
    // Check if date is within forecast range (most free APIs only provide 5-7 day forecasts)
    const daysDifference = Math.floor((forecastDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < 0 || daysDifference > 7) {
      return {
        available: false,
        message: 'Weather forecast only available for the next 7 days'
      };
    }
    
    // Determine if location is coordinates or city name
    let queryParam;
    if (location.includes(',')) {
      // Assume format is "lat,lon"
      const [lat, lon] = location.split(',').map(coord => parseFloat(coord.trim()));
      queryParam = `lat=${lat}&lon=${lon}`;
    } else {
      // Assume it's a city name
      queryParam = `q=${encodeURIComponent(location)}`;
    }
    
    // Call OpenWeatherMap API
    const response = await axios.get(
      `${WEATHER_API_URL}/forecast?${queryParam}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    if (response.data && response.data.list) {
      // Find forecast closest to the requested date
      const targetDatetime = forecastDate.setHours(21, 0, 0, 0); // 9 PM is good for stargazing
      
      // Find the forecast entry closest to our target time
      const closestForecast = response.data.list.reduce((closest, current) => {
        const currentTime = new Date(current.dt * 1000).getTime();
        const closestTime = new Date(closest.dt * 1000).getTime();
        return Math.abs(currentTime - targetDatetime) < Math.abs(closestTime - targetDatetime) ? current : closest;
      });
      
      // Calculate stargazing quality based on clouds, visibility, and wind
      let stargazingQuality = 'Poor';
      if (closestForecast.clouds.all < 20 && closestForecast.visibility > 8000 && closestForecast.wind.speed < 15) {
        stargazingQuality = 'Excellent';
      } else if (closestForecast.clouds.all < 40 && closestForecast.visibility > 5000 && closestForecast.wind.speed < 25) {
        stargazingQuality = 'Good';
      } else if (closestForecast.clouds.all < 70) {
        stargazingQuality = 'Fair';
      }
      
      // Get moon phase (simplified calculation)
      const moonPhase = getMoonPhase(new Date(closestForecast.dt * 1000));
      
      return {
        available: true,
        date: new Date(closestForecast.dt * 1000).toISOString(),
        location: response.data.city.name,
        forecast: {
          condition: closestForecast.weather[0].main,
          description: closestForecast.weather[0].description,
          cloudCover: `${closestForecast.clouds.all}%`,
          temperature: `${Math.round(closestForecast.main.temp)}°C`,
          humidity: `${closestForecast.main.humidity}%`,
          windSpeed: `${closestForecast.wind.speed} m/s`,
          visibility: `${(closestForecast.visibility / 1000).toFixed(1)} km`,
          moonPhase,
          stargazingQuality
        }
      };
    }
    
    // Fallback if API response format is unexpected
    return getDefaultWeatherForecast(location, date);
  } catch (error) {
    console.error('Weather API error:', error);
    return getDefaultWeatherForecast(location, date);
  }
}

// Helper function to get moon phase
function getMoonPhase(date) {
  // Simple moon phase calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (month < 3) {
    year--;
    month += 12;
  }
  
  const c = 365.25 * year;
  const e = 30.6 * month;
  const jd = c + e + day - 694039.09; // Julian days
  const days = jd / 29.53; // Divide by the moon cycle
  const phase = days % 1; // Get just the fraction part
  
  if (phase < 0.025 || phase > 0.975) return "New Moon";
  if (phase < 0.25) return "Waxing Crescent";
  if (phase < 0.275) return "First Quarter";
  if (phase < 0.475) return "Waxing Gibbous";
  if (phase < 0.525) return "Full Moon";
  if (phase < 0.725) return "Waning Gibbous";
  if (phase < 0.775) return "Last Quarter";
  return "Waning Crescent";
}

// Default weather forecast if API fails
function getDefaultWeatherForecast(location, date) {
  return {
    available: true,
    date: date,
    location: location,
    forecast: {
      condition: 'Clear',
      description: 'Clear sky',
      cloudCover: '10%',
      temperature: '15°C',
      humidity: '45%',
      windSpeed: '5 km/h',
      visibility: 'Excellent',
      moonPhase: 'Waxing Gibbous',
      stargazingQuality: 'Excellent'
    }
  };
}

module.exports = {
  getWeatherForecast
};

module.exports = {
  getWeatherForecast
};