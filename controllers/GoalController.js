const redis = require('../config/redis');
const calculateCurrentValue = require('../helpers/calculateCurrentValue');
const { Goal, Activity } = require('../models/');
const { Op } = require('sequelize');

class GoalController {
  static async findAll(req, res, next) {
    try {
      const result = await redis.get(`goals:${req.user.id}`);
      if (result) {
        return res.json(JSON.parse(result));
      }
      const goals = await Goal.findAll({
        where: {
          UserId: req.user.id,
        },
        order: [['updatedAt', 'DESC']],
      });
      await redis.set(`goals:${req.user.id}`, JSON.stringify(goals));
      res.json(goals);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async findAchieved(req, res, next) {
    try {
      const goals = await Goal.findAll({
        where: {
          UserId: req.user.id,
          isAchieved: true,
        },
      });
      res.json(goals);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async findByPk(req, res, next) {
    try {
      const goal = req.goal;
      res.json(goal);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async destroy(req, res, next) {
    try {
      const goal = req.goal;
      await goal.destroy();
      await redis.del(`goals:${req.user.id}`);
      res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async update(req, res, next) {
    const { targetValue, startDate, endDate } = req.body;
    try {
      const goal = req.goal;
      goal.targetValue = targetValue !== undefined ? targetValue : goal.targetValue;
      goal.startDate = startDate !== undefined ? startDate : goal.startDate;
      goal.endDate = endDate !== undefined ? endDate : goal.endDate;
      goal.currentValue = await calculateCurrentValue(goal);
      goal.isAchieved = goal.currentValue >= goal.targetValue;
      await goal.save();
      await redis.del(`goals:${req.user.id}`);
      res.json(goal);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async create(req, res, next) {
    const { typeName, targetValue, startDate, endDate } = req.body;
    try {
      let currentValue = 0;
      const activities = await Activity.findAll({ where: { UserId: req.user.id, activityDate: { [Op.gte]: startDate }, activityDate: { [Op.lte]: endDate } } });
      activities.forEach((activity) => {
        switch (typeName) {
          case 'steps':
            if (activity.typeName === 'running' || activity.typeName === 'walking' || activity.typeName === 'hiking') {
              const steps = Math.round(activity.distance * 1.3123);
              currentValue += steps;
            }
            break;
          case 'distance':
            currentValue += activity.distance;
            break;
          case 'calories burned':
            currentValue += activity.caloriesBurned;
            break;
          default:
            currentValue += activity.duration;
            break;
        }
      });
      const newGoal = await Goal.create({ UserId: req.user.id, typeName, targetValue, currentValue, startDate, endDate, isAchieved: currentValue >= targetValue });
      await redis.del(`goals:${req.user.id}`);
      res.status(201).json(newGoal);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}

module.exports = GoalController;
