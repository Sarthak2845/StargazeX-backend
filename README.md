# StargazeX Backend

A backend service for the StargazeX astronomy event platform, allowing users to create and join stargazing events, track celestial objects, and get weather forecasts for optimal viewing conditions.

## Features

- **User Authentication**: Secure Firebase authentication
- **Event Management**: Create, join, and manage stargazing events
- **Weather Integration**: Real-time weather forecasts for stargazing locations
- **Astronomy Data**: Information about visible celestial objects
- **Telescope Management**: Register and get recommendations for telescopes

## API Integration

This backend integrates with two external APIs:

1. **OpenWeatherMap API**: For weather forecasts
   - Used to determine stargazing conditions
   - Provides cloud cover, visibility, and temperature data

2. **Astronomy API**: For celestial object data
   - Provides information on visible planets, stars, and other objects
   - Calculates positions based on location and time

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   WEATHER_API_KEY=your_openweathermap_api_key
   ASTRONOMY_API_KEY=your_astronomy_api_key
   ```

3. Set up Firebase:
   - Create a Firebase project
   - Generate a service account key
   - Save it as `firebasesecrets.json` in the project root

4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### User Management
- `POST /api/user/register`: Register a new user
- `GET /api/user/profile`: Get user profile

### Events
- `POST /api/events/create`: Create a new event
- `GET /api/events/local`: Get events in a location
- `GET /api/events/joined`: Get events joined by user
- `POST /api/events/join/:eventId`: Join an event
- `POST /api/events/leave/:eventId`: Leave an event
- `POST /api/events/:eventId/comments`: Add a comment to an event
- `GET /api/events/:eventId`: Get event details
- `DELETE /api/events/:eventId`: Cancel an event

### Astronomy
- `GET /api/astronomy/visible-objects`: Get visible celestial objects
- `GET /api/astronomy/upcoming-events`: Get upcoming astronomical events
- `GET /api/astronomy/weather-forecast`: Get weather forecast
- `GET /api/astronomy/stargazing-conditions`: Get combined stargazing conditions

### Telescopes
- `GET /api/telescopes/types`: Get telescope types
- `POST /api/telescopes/register`: Register a telescope
- `GET /api/telescopes/my-telescopes`: Get user's telescopes
- `GET /api/telescopes/recommendations`: Get telescope recommendations