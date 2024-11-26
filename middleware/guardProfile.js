const { UserProfile } = require('../models');

module.exports = async function guardProfile(req, res, next) {
  // console.log(id);

  try {
    let user = req.user;

    if (!user) {
      throw { name: 'Unauthorized', message: 'User not authenticated' };
    }

    const id = req.user.id;
    const profile = await UserProfile.findOne({
      where: { UserId: id },
    });

    if (!profile) {
      throw { name: 'NotFound', message: 'Profile Not Found' };
    } else if (profile.UserId === user.id) {
      req.profile = profile;
      return next();
    } else {
      throw { name: 'Forbidden', message: 'You are not authorized' };
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
