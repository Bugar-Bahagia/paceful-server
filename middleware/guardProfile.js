const { UserProfile } = require('../models');

module.exports = async function guardProfile(req, res, next) {
  try {
    const id = req.user.id;
    const profile = await UserProfile.findOne({
      where: { UserId: id },
    });

    req.profile = profile;
    return next();

    // if (!profile) {
    //   throw { name: 'NotFound', message: 'Profile Not Found' };
    // } else if (profile.UserId === user.id) {
    //   req.profile = profile;
    //   return next();
    // } else {
    //   throw { name: 'Forbidden', message: 'You are not authorized' };
    // }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
