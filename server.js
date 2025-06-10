const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { router: userRoutes } = require('./routes/user');
const eventRoutes = require('./routes/events');
const newsRoutes = require('./routes/spacenews');
const astronomyRoutes = require('./routes/astronomy');
const telescopeRoutes = require('./routes/telescopes');
const podRoutes = require('./routes/pod');
const app = express();

// Enhanced security with helmet
app.use(helmet());

// CORS configuration
app.use(cors());

// Request logging
app.use(morgan('dev'));

// Parse JSON request body
app.use(express.json());

// Rate limiting for API endpoints
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// API routes
app.use('/api/user', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/astronomy', astronomyRoutes);
app.use('/api/telescopes', telescopeRoutes);
app.use('/api/pod', podRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import error handling middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// 404 handler for undefined routes
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));