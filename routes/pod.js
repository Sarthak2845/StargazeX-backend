const express = require('express');
const router = express.Router();
const axios = require('axios');
router.get('/',async (req,res)=>{
    try {
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news ' });
        
    }
})