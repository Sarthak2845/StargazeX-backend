const express = require('express');
const router = express.Router();
const { db, FieldValue } = require('../services/firebase-admin');
const { verifyToken } = require('./user');

// Get all telescope types
router.get('/types', async (req, res) => {
  try {
    const telescopeTypes = [
      {
        id: 'refractor',
        name: 'Refractor Telescope',
        description: 'Uses lenses to gather and focus light. Good for planetary viewing.',
        bestFor: ['Moon', 'Planets', 'Double Stars'],
        imageUrl: 'https://example.com/refractor.jpg'
      },
      {
        id: 'reflector',
        name: 'Reflector Telescope',
        description: 'Uses mirrors to gather and focus light. Good for deep sky objects.',
        bestFor: ['Galaxies', 'Nebulae', 'Star Clusters'],
        imageUrl: 'https://example.com/reflector.jpg'
      },
      {
        id: 'compound',
        name: 'Compound Telescope',
        description: 'Uses both lenses and mirrors. Versatile for various objects.',
        bestFor: ['Planets', 'Galaxies', 'Nebulae'],
        imageUrl: 'https://example.com/compound.jpg'
      },
      {
        id: 'dobsonian',
        name: 'Dobsonian Telescope',
        description: 'A type of reflector with simple mount. Great for beginners.',
        bestFor: ['Deep Sky Objects', 'Planets'],
        imageUrl: 'https://example.com/dobsonian.jpg'
      }
    ];
    
    res.json(telescopeTypes);
  } catch (error) {
    console.error('Get telescope types error:', error);
    res.status(500).json({ error: 'Failed to fetch telescope types' });
  }
});

// Register user's telescope
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { type, model, aperture, focalLength } = req.body;
    
    if (!type || !model) {
      return res.status(400).json({ error: 'Telescope type and model are required' });
    }
    
    const telescope = {
      type,
      model,
      aperture,
      focalLength,
      userId: req.user.uid,
      registeredAt: new Date().toISOString()
    };
    
    const telescopeRef = await db.collection('telescopes').add(telescope);
    
    // Also add to user's profile
    await db.collection('users').doc(req.user.uid).update({
      telescopes: FieldValue.arrayUnion({
        id: telescopeRef.id,
        type,
        model
      })
    });
    
    res.json({ id: telescopeRef.id, ...telescope });
  } catch (error) {
    console.error('Register telescope error:', error);
    res.status(500).json({ error: 'Failed to register telescope' });
  }
});

// Get user's telescopes
router.get('/my-telescopes', verifyToken, async (req, res) => {
  try {
    const telescopes = await db.collection('telescopes')
      .where('userId', '==', req.user.uid)
      .get();
      
    const data = telescopes.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(data);
  } catch (error) {
    console.error('Get user telescopes error:', error);
    res.status(500).json({ error: 'Failed to fetch telescopes' });
  }
});

// Get telescope recommendations for celestial objects
router.get('/recommendations', async (req, res) => {
  try {
    const { objectType } = req.query;
    
    if (!objectType) {
      return res.status(400).json({ error: 'Object type is required' });
    }
    
    let recommendations = [];
    
    switch (objectType.toLowerCase()) {
      case 'planet':
        recommendations = [
          { type: 'refractor', reason: 'Sharp, high-contrast images ideal for planetary detail' },
          { type: 'compound', reason: 'Good all-around performance for planetary viewing' }
        ];
        break;
      case 'galaxy':
        recommendations = [
          { type: 'reflector', reason: 'Large aperture gathers more light for dim galaxies' },
          { type: 'dobsonian', reason: 'Cost-effective way to get large aperture for deep sky objects' }
        ];
        break;
      case 'nebula':
        recommendations = [
          { type: 'reflector', reason: 'Large aperture for gathering light from faint nebulae' },
          { type: 'compound', reason: 'Good balance of aperture and portability' }
        ];
        break;
      default:
        recommendations = [
          { type: 'dobsonian', reason: 'Great all-around beginner telescope' },
          { type: 'refractor', reason: 'Low maintenance and good for various objects' }
        ];
    }
    
    res.json(recommendations);
  } catch (error) {
    console.error('Get telescope recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;