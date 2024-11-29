// const { UserProfile } = require('../models');

module.exports = class UsersController {
  static async updateProfile(req, res, next) {
    try {
      const { name, dateOfBirth, email } = req.body;
      const profile = req.profile;
      const user = req.user
      await profile.update({
        name,
        dateOfBirth,
      });

      await user.update({
        email
      })

      const emailuser = user.email

      res.status(200).json({ message: 'Your Profile has been updated', data: profile, emailuser });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const profile = req.profile;
      const user = req.user
      const email = user.email
     
      res.status(200).json({ data: profile, email});
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  static async removeProfile(req, res, next) {
    try {
      const user = req.user
      await user.destroy()

      res.status(200).json({ message: 'Your account has been deleted successfully'});
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
  
};
