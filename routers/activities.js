const express = require('express');
const ActivityController = require('../controllers/ActivityController');
const router = express.Router();

// base url => /activities
router.get('/', ActivityController.findAll);
router.post('/', ActivityController.create);
router.put('/:id', ActivityController.update);
router.delete('/:id', ActivityController.destroy);

module.exports = router;
