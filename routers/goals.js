const express = require('express');
const GoalController = require('../controllers/GoalController');
const guardGoal = require('../middleware/guardGoal');
const router = express.Router();

// base url => /goals
router.get('/', GoalController.findAll);
router.post('/', GoalController.create);
router.get('/achieved', GoalController.findAchieved);
router.get('/:id', guardGoal, GoalController.findByPk);
router.put('/:id', guardGoal, GoalController.updateByPk);
router.delete('/:id', guardGoal, GoalController.destroyByPk);

module.exports = router;
