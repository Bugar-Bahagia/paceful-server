const express = require('express');
const ActivityController = require('../controllers/ActivityController');
const guardActivity = require('../middleware/guardActivity');
const router = express.Router();

// base url => /activities
router.get('/', ActivityController.findAll);
router.post('/', ActivityController.create);
router.put('/:id', guardActivity, ActivityController.update);
router.delete('/:id', guardActivity, ActivityController.destroy);

module.exports = router;
