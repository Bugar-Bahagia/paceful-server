const { Goal, Activity } = require('../models/');

class GoalController {
  static async findAll(req, res, next) {
    try {
      const goals = await Goal.findAll({
        where: {
          UserId: req.user.id,
        },
      });
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
      const goal = await Goal.findByPk(req.params.id);
      res.json(goal);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async destroyByPk(req, res, next) {
    try {
      const goal = await Goal.findByPk(req.params.id);
      if (!goal) {
        throw { name: 'NotFound', message: 'Goal not found' };
      }
      await goal.destroy();
      res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async updateByPk(req, res, next) {
    try {
      const goal = await Goal.findByPk(req.params.id);
      if (!goal) {
        throw { name: 'NotFound', message: 'Goal not found' };
      }
      goal.targetValue = targetValue !== undefined ? targetValue : goal.targetValue;
      goal.startDate = startDate !== undefined ? startDate : goal.startDate;
      goal.endDate = endDate !== undefined ? endDate : goal.endDate;
      let currentValue = 0;
      const activities = await Activity.findAll({ where: { UserId: req.user.id, activityDate: { [Op.gte]: startDate }, activityDate: { [Op.lte]: endDate } } });
      for (let activity of activities) {
        switch (goal.typeName) {
          case 'steps':
            if (activity.typeName === 'running' || activity.typeName === 'walking') {
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
      }
      goal.currentValue = currentValue;
      await goal.save();
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
            if (activity.typeName === 'running' || activity.typeName === 'walking') {
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
      res.status(201).json(newGoal);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}

module.exports = GoalController;
