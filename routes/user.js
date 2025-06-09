const express = require('express');
const router = express.Router();
const { auth, db } = require('../services/firebase-admin');

// Middleware: verify Firebase token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/profile', verifyToken, async (req, res) => {
  const userRef = db.collection('users').doc(req.user.uid);
  const doc = await userRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'User not found' });
  res.json(doc.data());
});

router.post('/register', verifyToken, async (req, res) => {
  console.log('User:', req.user);
  console.log('Body:', req.body);
  try {
    const { name } = req.body;
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.set({ name, uid: req.user.uid }, { merge: true });
    res.json({ message: 'User profile saved' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = {
  router,
  verifyToken
};
