const { DateTime } = require('luxon');
const { Activity } = require('../models/');
const { Op } = require('sequelize');

async function calculateCurrentValue(goal) {
  let currentValue = 0;
  const activities = await Activity.findAll({
    where: {
      UserId: goal.UserId,
      activityDate: { [Op.gte]: `${DateTime.fromISO(new Date(goal.startDate).toISOString()).toFormat('yyyy-LL-dd HH:mm:ssZZ')}`, [Op.lte]: `${DateTime.fromISO(new Date(goal.endDate).toISOString()).toFormat('yyyy-LL-dd HH:mm:ssZZ')}` },
    },
  });
  for (let activity of activities) {
    switch (goal.typeName) {
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
  }
  return currentValue;
}

module.exports = calculateCurrentValue;
