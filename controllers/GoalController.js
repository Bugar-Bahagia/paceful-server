const redis = require('../config/redis');
const calculateCurrentValue = require('../helpers/calculateCurrentValue');
const { Goal, Activity } = require('../models/');
const { Op } = require('sequelize');

class GoalController {
  static async findAll(req, res, next) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = 5;
      const offset = (page - 1) * limit;
      const cacheKey = `goals:${req.user.id}:page:${page}:limit:${limit}`;
      const result = await redis.get(cacheKey);
      if (result) {
        return res.json(JSON.parse(result));
      }

      const { count, rows } = await Goal.findAndCountAll({
        where: {
          UserId: req.user.id,
        },
        limit: limit,
        offset: offset,
        order: [['updatedAt', 'DESC']],
      });
      const totalPage = Math.ceil(count / limit);
      await redis.set(cacheKey, JSON.stringify({ totalGoal: count, totalPage, currPage: page, goals: rows }));
      res.json({ totalGoal: count, totalPage, currPage: page, goals: rows });
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
      const goalKeys = await redis.keys(`goals:${req.user.id}:page:*`);
      if (goalKeys.length > 0) {
        await redis.del(goalKeys);
      }
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
      const goalKeys = await redis.keys(`goals:${req.user.id}:page:*`);
      if (goalKeys.length > 0) {
        await redis.del(goalKeys);
      }
      res.json(goal);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async create(req, res, next) {
    const { typeName, targetValue, startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      throw { name: 'BadRequest', message: 'Start date and end date are required' };
    }

    try {
      let currentValue = 0;
      const activities = await Activity.findAll({
        where: {
          UserId: req.user.id,
          activityDate: { [Op.gte]: startDate, [Op.lte]: endDate },
        },
      });
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
      const keys = await redis.keys(`goals:${req.user.id}:page:*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
      res.status(201).json(newGoal);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}

module.exports = GoalController;
