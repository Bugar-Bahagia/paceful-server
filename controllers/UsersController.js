// const { UserProfile } = require('../models');

module.exports = class UsersController {
  static async updateProfile(req, res, next) {
    try {
      const { name, dateOfBirth } = req.body;
      const profile = req.profile;
      await profile.update({
        name,
        dateOfBirth,
      });

      res.status(200).json({ message: 'Your Profile has been updated', data: profile });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const profile = req.profile;
      res.status(200).json({ data: profile });
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
