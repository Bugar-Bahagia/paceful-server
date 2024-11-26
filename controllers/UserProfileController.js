// const { UserProfile } = require('../models');

module.exports = class UserProfileController {
  static async updateProfile(req, res, next) {
    try {
      const { name, dateOfBirth } = req.body;
      const profile = req.profile;
      await profile.update({
        name,
        dateOfBirth,
      });
       
      res
        .status(200)
        .json({ message: "Your Profile has been updated", data: profile });

    } catch (error) {
      console.error(error);
      next(error);
    }
  
  }


}