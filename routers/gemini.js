const express = require('express');
const GeminiController = require('../controllers/GeminiController');
const router = express.Router();

// base url => /gemini
router.get('/', GeminiController.generateText);

module.exports = router;
