// const { UserProfile } = require('../models');

const redis = require('../config/redis');

module.exports = class UsersController {
  static async updateProfile(req, res, next) {
    try {
      const { name, dateOfBirth } = req.body;
      const profile = req.profile;
      const user = req.user;
      await profile.update({
        name,
        dateOfBirth,
      });

      const emailuser = user.email;

      res.status(200).json({ message: 'Your Profile has been updated', data: profile });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const profile = req.profile;
      const user = req.user;
      const email = user.email;

      res.status(200).json({ data: profile, email });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  static async removeProfile(req, res, next) {
    try {
      const user = req.user;
      await user.destroy();
      const goalKeys = await redis.keys(`goals:${req.user.id}:page:*`);
      if (goalKeys.length > 0) {
        await redis.del(goalKeys);
      }
      const activityKeys = await redis.keys(`activities:${req.user.id}:page:*`);
      if (activityKeys.length > 0) {
        await redis.del(activityKeys);
      }

      res.status(200).json({ message: 'Your account has been deleted successfully' });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
};
