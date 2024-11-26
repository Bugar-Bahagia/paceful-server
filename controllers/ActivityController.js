const calculateCalories = require('../helpers/calculateCalories');
const { Op } = require('sequelize');
const { Activity, Goal, sequelize } = require('../models/');

class ActivityController {
  static async findAll(req, res, next) {
    try {
      const activities = await Activity.findAll({
        where: {
          UserId: req.user.id,
        },
      });
      res.json(activities);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async create(req, res, next) {
    const { typeName, duration, distance, notes, activityDate } = req.body;
    const caloriesBurned = calculateCalories(typeName, duration);

    const t = await sequelize.transaction();
    try {
      const newActivity = await Activity.create({ UserId: req.user.id, typeName, duration, distance, notes, activityDate, caloriesBurned }, { transaction: t });
      const goals = await Goal.findAll({
        where: {
          UserId: newActivity.UserId,
          startDate: { [Op.gte]: newActivity.activityDate },
          endDate: { [Op.lte]: newActivity.activityDate },
        },
      });
      for (let goal of goals) {
        let updatedValue = goal.currentValue;
        switch (goal.typeName) {
          case 'steps':
            if (newActivity.typeName === 'running' || newActivity.typeName === 'walking') {
              const steps = Math.round(distance * 1.3123);
              updatedValue += steps;
            }
            break;
          case 'distance':
            updatedValue += distance;
            break;
          case 'calories burned':
            updatedValue += newActivity.caloriesBurned;
            break;
          default:
            updatedValue += newActivity.duration;
            break;
        }
        const isAchieved = updatedValue >= goal.targetValue;
        await Goal.update({ currentValue: updatedValue, isAchieved, updatedAt: new Date() }, { where: { id: goal.id }, transaction: t });
      }
      await t.commit();
      res.status(201).json(newActivity);
    } catch (error) {
      console.log(error);
      await t.rollback();
      next(error);
    }
  }

  static async update(req, res, next) {
    const activity = req.activity;
    const { duration, distance, notes } = req.body;
    const t = await sequelize.transaction();
    try {
      let caloriesBurned = activity.caloriesBurned;
      if (duration !== undefined) {
        caloriesBurned = calculateCalories(activity.typeName, duration);
      }

      const oldDuration = activity.duration;
      const oldDistance = activity.distance;
      const oldCaloriesBurned = activity.caloriesBurned;

      activity.duration = duration !== undefined ? duration : activity.duration;
      activity.distance = distance !== undefined ? distance : activity.distance;
      activity.caloriesBurned = caloriesBurned;
      activity.notes = notes !== undefined ? notes : activity.notes;

      await activity.save({ transaction: t });

      const goals = await Goal.findAll({
        where: {
          UserId: activity.UserId,
          startDate: { [Op.gte]: activity.activityDate },
          endDate: { [Op.lte]: activity.activityDate },
        },
      });

      for (let goal of goals) {
        let updatedValue = goal.currentValue;
        switch (goal.typeName) {
          case 'steps':
            if (activity.typeName === 'running' || activity.typeName === 'walking') {
              const oldSteps = Math.round(oldDistance * 1.3123);
              const newSteps = Math.round(distance * 1.3123);
              updatedValue = updatedValue - oldSteps + newSteps;
            }
            break;
          case 'distance':
            updatedValue = updatedValue - oldDistance + distance;
            break;
          case 'calories burned':
            updatedValue = updatedValue - oldCaloriesBurned + caloriesBurned;
            break;
          default:
            updatedValue = updatedValue - oldDuration + duration;
            break;
        }
        const isAchieved = updatedValue >= goal.targetValue;
        await Goal.update({ currentValue: updatedValue, isAchieved, updatedAt: new Date() }, { where: { id: goal.id }, transaction: t });
      }
      await t.commit();
      res.json(activity);
    } catch (error) {
      console.log(error);
      await t.rollback();
      next(error);
    }
  }

  static async destroy(req, res, next) {
    const activity = req.activity;
    const t = await sequelize.transaction();
    try {
      const oldDuration = activity.duration;
      const oldDistance = activity.distance;
      const oldCaloriesBurned = activity.caloriesBurned;
      await activity.destroy({ transanction: t });

      const goals = await Goal.findAll({
        where: {
          UserId: activity.UserId,
          startDate: { [Op.gte]: activity.activityDate },
          endDate: { [Op.lte]: activity.activityDate },
        },
      });

      for (let goal of goals) {
        let updatedValue = goal.currentValue;
        switch (goal.typeName) {
          case 'steps':
            if (activity.typeName === 'running' || activity.typeName === 'walking') {
              const oldSteps = Math.round(oldDistance * 1.3123);
              updatedValue -= oldSteps;
            }
            break;
          case 'distance':
            updatedValue -= oldDistance;
            break;
          case 'calories burned':
            updatedValue -= oldCaloriesBurned;
            break;
          default:
            updatedValue -= oldDuration;
            break;
        }
        const isAchieved = updatedValue >= goal.targetValue;
        await Goal.update({ currentValue: updatedValue, isAchieved, updatedAt: new Date() }, { where: { id: goal.id }, transaction: t });
      }
      await t.commit();
      res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
      console.log(error);
      await t.rollback();
      next(error);
    }
  }
}

module.exports = ActivityController;
