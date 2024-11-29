const express = require('express');
const GeminiController = require('../controllers/GeminiController');
const router = express.Router();

// base url => /gemini
router.get('/', GeminiController.generatePrompt);

module.exports = router;
