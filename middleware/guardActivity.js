const { Activity } = require('../models');

module.exports = async function guardActivity(req, res, next) {
  const id = req.params.id;

  try {
    let user = req.user;

    if (!user) {
      throw { name: 'Unauthorized', message: 'User not authenticated' };
    }
    const activity = await Activity.findByPk(id);

    if (!activity) {
      throw { name: 'NotFound', message: 'Activity Not Found' };
    } else if (activity.UserId === user.id) {
      req.activity = activity;
      return next();
    } else {
      throw { name: 'Forbidden', message: 'You are not authorized' };
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};