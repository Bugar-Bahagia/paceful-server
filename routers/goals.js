const express = require('express');
const GoalController = require('../controllers/GoalController');
const guardGoal = require('../middleware/guardGoal');
const router = express.Router();

// base url => /goals
router.get('/', GoalController.findAll);
router.post('/', GoalController.create);
router.get('/achieved', GoalController.findAchieved);
router.get('/:id', guardGoal, GoalController.findByPk);
router.put('/:id', guardGoal, GoalController.update);
router.delete('/:id', guardGoal, GoalController.destroy);

module.exports = router;
