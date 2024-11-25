const express = require('express');
const GoalController = require('../controllers/GoalController');
const router = express.Router();

// base url => /goals
router.get('/', GoalController.findAll);
router.post('/', GoalController.create);
router.get('/achieved', GoalController.findAchieved);
router.get('/:id', GoalController.findByPk);
router.put('/:id', GoalController.updateByPk);
router.delete('/:id', GoalController.destroyByPk);

module.exports = router;
