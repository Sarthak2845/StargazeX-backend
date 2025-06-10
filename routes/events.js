const express = require('express');
const router = express.Router();
const { db, FieldValue } = require('../services/firebase-admin');
const { verifyToken } = require('./user'); // reuse middleware
const { validateEventCreation, validateComment } = require('../middleware/validators');
const { getWeatherForecast } = require('../services/weather');
const { getVisibleCelestialObjects } = require('../services/celestial');

// ✅ Create a new event
router.post('/create', verifyToken, validateEventCreation, async (req, res) => {
  try {
    const { title, date, location, telescope, description, visibility = 'public', maxAttendees = null } = req.body;

    const newEvent = {
      title,
      date,
      location,
      telescope,
      description,
      visibility, // 'public' or 'private'
      maxAttendees, // null means unlimited
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      attendees: [req.user.uid], // Creator is first attendee
      comments: [],
      weather: null, // Will be populated by weather API
      celestialObjects: [], // Celestial objects visible during event
    };

    const eventRef = await db.collection('events').add(newEvent);
    res.json({ id: eventRef.id, ...newEvent });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ✅ Get all events at a given location (with attendee count)
router.get('/local', async (req, res) => {
  try {
    const { location, limit = 10, startAfter } = req.query;
    
    let query = db.collection('events')
      .where('location', '==', location)
      .where('visibility', '==', 'public')
      .orderBy('date', 'asc')
      .limit(parseInt(limit));
      
    if (startAfter) {
      const startAfterDoc = await db.collection('events').doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }
    
    const events = await query.get();

    const data = events.docs.map(doc => {
      const event = doc.data();
      return {
        id: doc.id,
        ...event,
        attendeeCount: event.attendees ? event.attendees.length : 0,
      };
    });

    res.json({
      events: data,
      lastDoc: events.docs.length > 0 ? events.docs[events.docs.length - 1].id : null,
      hasMore: events.docs.length >= parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch local events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ✅ Get all events the user has joined (with attendee count)
router.get('/joined', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('events')
      .where('attendees', 'array-contains', req.user.uid)
      .orderBy('date', 'asc')
      .get();

    const data = snapshot.docs.map(doc => {
      const event = doc.data();
      return {
        id: doc.id,
        ...event,
        attendeeCount: event.attendees ? event.attendees.length : 0,
        isCreator: event.createdBy === req.user.uid
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Fetch joined events error:', error);
    res.status(500).json({ error: 'Failed to fetch joined events' });
  }
});

// ✅ Join an event
router.post('/join/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventData = eventDoc.data();
    
    // Check if event is private
    if (eventData.visibility === 'private' && eventData.createdBy !== req.user.uid) {
      return res.status(403).json({ error: 'This is a private event' });
    }
    
    // Check if event is full
    if (eventData.maxAttendees && eventData.attendees && 
        eventData.attendees.length >= eventData.maxAttendees) {
      return res.status(400).json({ error: 'Event has reached maximum capacity' });
    }

    await eventRef.update({
      attendees: FieldValue.arrayUnion(req.user.uid),
    });

    res.json({ message: 'Successfully joined the event!' });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ error: 'Failed to join event' });
  }
});

// ✅ Leave an event
router.post('/leave/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventData = eventDoc.data();
    
    // Check if user is the creator and there are other attendees
    if (eventData.createdBy === req.user.uid && 
        eventData.attendees && 
        eventData.attendees.length > 1) {
      return res.status(400).json({ 
        error: 'Event creator cannot leave while others are attending. Cancel the event instead.' 
      });
    }

    await eventRef.update({
      attendees: FieldValue.arrayRemove(req.user.uid),
    });

    res.json({ message: 'Successfully left the event!' });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({ error: 'Failed to leave event' });
  }
});

// ✅ Add comment to an event
router.post('/:eventId/comments', verifyToken, validateComment, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const comment = {
      text,
      userId: req.user.uid,
      createdAt: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    await db.collection('events').doc(eventId).update({
      comments: FieldValue.arrayUnion(comment)
    });
    
    res.json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ✅ Get event details with attendee information and weather forecast
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventDoc = await db.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventData = eventDoc.data();
    
    // Get user details for attendees
    const attendeePromises = eventData.attendees.map(async (uid) => {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        return { uid, name: userData.name };
      }
      return { uid, name: 'Unknown User' };
    });
    
    const attendees = await Promise.all(attendeePromises);
    
    // Get weather forecast and celestial objects for the event
    let weather = null;
    let celestialObjects = [];
    
    try {
      // Only fetch weather and celestial data if event has a date and location
      if (eventData.date && eventData.location) {
        [weather, celestialObjects] = await Promise.all([
          getWeatherForecast(eventData.location, eventData.date),
          getVisibleCelestialObjects(eventData.date, eventData.location)
        ]);
      }
    } catch (error) {
      console.error('Weather/celestial data error:', error);
      // Continue without weather/celestial data if there's an error
    }
    
    res.json({
      id: eventDoc.id,
      ...eventData,
      attendees,
      weather,
      celestialObjects
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// ✅ Cancel an event (creator only)
router.delete('/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventRef = db.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventData = eventDoc.data();
    
    // Only creator can cancel
    if (eventData.createdBy !== req.user.uid) {
      return res.status(403).json({ error: 'Only the event creator can cancel this event' });
    }
    
    await eventRef.delete();
    
    res.json({ message: 'Event successfully cancelled' });
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({ error: 'Failed to cancel event' });
  }
});

module.exports = router;