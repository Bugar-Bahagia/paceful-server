const calculateCalories = require('../helpers/calculateCalories');
const { Activity, Goal } = require('../models/');

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
          isAchieved: false,
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
}

module.exports = ActivityController;
