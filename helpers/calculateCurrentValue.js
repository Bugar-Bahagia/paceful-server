const { Activity } = require('../models/');

async function calculateCurrentValue(goal) {
  let currentValue = 0;
  const activities = await Activity.findAll({ where: { UserId: goal.UserId, activityDate: { [Op.gte]: goal.startDate }, activityDate: { [Op.lte]: goal.endDate } } });
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
  return currentValue;
}

module.exports = calculateCurrentValue;
