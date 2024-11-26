const { UserProfile, Goal } = require('../models');

module.exports = async function guardGoal(req, res, next) {
  let user = req.user;

  if (!user) {
    throw { name: 'Unauthorized', message: 'User not authenticated' }
  }

  const id = req.params.id;

  try {
    const goal = await Goal.findByPk(id);

    if (!goal) {
      throw { name: 'NotFound', message: 'Goal Not Found' };
    } else if (goal.UserId === user.id) {
      req.goal = goal;
      return next();
    } else {
      throw { name: 'Forbidden', message: 'You are not authorized' };
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
