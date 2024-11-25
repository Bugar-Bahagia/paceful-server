const { UserProfile } = require('../models');

module.exports = async function guardProfile(req, res, next) {
  let user = req.user;

  if (!user) {
    return next({ name: "NotAuthorized", message: "User not authenticated" });
  }

    const id = req.user.id;

    // console.log(id);
    

    try {
      const profile = await UserProfile.findOne({
        where: { UserId: id },
      });

      if (!profile) {
        throw { name: "NotFound", message: "Profile Not Found" };
      }

      else if (profile.UserId === user.id) {
        req.profile = profile;
        return next();
      } else {
        throw { name: 'Forbidden', message: 'You are not authorized' };
      }
    } catch (error) {
      
      console.log(error);
      next(error)
    }
  }

