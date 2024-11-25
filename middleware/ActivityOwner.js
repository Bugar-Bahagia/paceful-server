const { Activity, UserProfile, Goal } = require('../models');

module.exports = async function guardActivity(req, res, next) {
  let user = req.user;

  if (!user) {
    return next({ name: "NotAuthorized", message: "User not authenticated" });
  }

    const { id } = req.params;

    
    try {
      const activity = await Activity.findByPk(id);

      if (!activity) {
        throw { name: "NotFound", message: "Activity Not Found" };
      }

      else if (activity.UserId === user.id) {
        return next();
      } else {   
        throw { name: 'Forbidden', message: 'You are not authorized' };
      }
    } catch (error) {
      console.log(error); 
      next(error)
    }
  }

