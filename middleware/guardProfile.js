const { UserProfile } = require('../models');

module.exports = async function guardProfile(req, res, next) {
  try {
    const id = req.user.id;
    const profile = await UserProfile.findOne({
      where: { UserId: id },
    });

    req.profile = profile;
    return next();

  
  } catch (error) {
    console.log(error);
    next(error);
  }
};
