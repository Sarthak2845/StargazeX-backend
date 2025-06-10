/**
 * Request validation middleware
 */

// Validate event creation request
const validateEventCreation = (req, res, next) => {
  const { title, date, location } = req.body;
  
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Event title is required' });
  }
  
  if (!date) {
    return res.status(400).json({ error: 'Event date is required' });
  }
  
  // Validate date format
  if (!Date.parse(date)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  
  if (!location || location.trim() === '') {
    return res.status(400).json({ error: 'Event location is required' });
  }
  
  next();
};

// Validate comment creation
const validateComment = (req, res, next) => {
  const { text } = req.body;
  
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  
  if (text.length > 500) {
    return res.status(400).json({ error: 'Comment cannot exceed 500 characters' });
  }
  
  next();
};

// Validate user registration
const validateUserRegistration = (req, res, next) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
  }
  
  next();
};

module.exports = {
  validateEventCreation,
  validateComment,
  validateUserRegistration
};