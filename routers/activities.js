const express = require('express');
const ActivityController = require('../controllers/ActivityController');
const router = express.Router();

// base url => /activities
router.get('/', ActivityController.findAll);
router.post('/', ActivityController.create);

module.exports = router;
