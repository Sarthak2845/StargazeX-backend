const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase-admin');
const { verifyToken } = require('./user'); // reuse middleware

router.post('/create', verifyToken, async (req, res) => {
  const { title, date, location, telescope } = req.body;
  const newEvent = {
    title,
    date,
    location,
    telescope,
    createdBy: req.user.uid,
    createdAt: new Date().toISOString(),
  };
  const eventRef = await db.collection('events').add(newEvent);
  res.json({ id: eventRef.id, ...newEvent });
});

router.get('/local', async (req, res) => {
  const { location } = req.query;
  const events = await db.collection('events').where('location', '==', location).get();
  const data = events.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(data);
});

router.get('/joined', verifyToken, async (req, res) => {
  const snapshot = await db.collection('events')
    .where('attendees', 'array-contains', req.user.uid).get();
  res.json(snapshot.docs.map(doc => doc.data()));
});

module.exports = router;
