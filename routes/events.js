const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase-admin');
const { verifyToken } = require('./user'); // reuse middleware
const { FieldValue } = require('firebase-admin/firestore');

// ✅ Create a new event
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { title, date, location, telescope } = req.body;

    const newEvent = {
      title,
      date,
      location,
      telescope,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      attendees: [req.user.uid], // Creator is first attendee
    };

    const eventRef = await db.collection('events').add(newEvent);
    res.json({ id: eventRef.id, ...newEvent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ✅ Get all events at a given location (with attendee count)
router.get('/local', async (req, res) => {
  try {
    const { location } = req.query;
    const events = await db.collection('events').where('location', '==', location).get();

    const data = events.docs.map(doc => {
      const event = doc.data();
      return {
        id: doc.id,
        ...event,
        attendeeCount: event.attendees ? event.attendees.length : 0,
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ✅ Get all events the user has joined (with attendee count)
router.get('/joined', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('events')
      .where('attendees', 'array-contains', req.user.uid)
      .get();

    const data = snapshot.docs.map(doc => {
      const event = doc.data();
      return {
        id: doc.id,
        ...event,
        attendeeCount: event.attendees ? event.attendees.length : 0,
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch joined events' });
  }
});

// ✅ Join an event
router.post('/join/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventRef = db.collection('events').doc(eventId);

    await eventRef.update({
      attendees: FieldValue.arrayUnion(req.user.uid),
    });

    res.json({ message: 'Successfully joined the event!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join event' });
  }
});

module.exports = router;
