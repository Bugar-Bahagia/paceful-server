const { comparePassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');
const { User, UserProfile } = require('../models');
const { sequelize } = require('../models');

class UserController {
  static async register(req, res, next) {
    const { name, dateOfBirth, email, password } = req.body;

    try {
      const result = await sequelize.transaction(async (t) => {
        // console.log(hashedPassword);

        const user = await User.create(
          {
            email,
            password,
          },
          { transaction: t }
        );

        const userProfile = await UserProfile.create(
          {
            name,
            dateOfBirth,
            UserId: user.id,
          },
          { transaction: t }
        );

        return { user, userProfile };
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  static async login(req, res, next) {
    const { email, password } = req.body;

    try {
      if (!email) {
        throw { name: 'BadRequest', message: 'Email is required' };
      }

      if (!password) {
        throw { name: 'BadRequest', message: 'Password is required' };
      }

      const user = await User.findOne({
        where: { email },
      });

      console.log(user);

      if (!user) {
        throw { name: 'Unauthorized', message: 'Invalid email or password' };
      }

      const isPasswordMatch = comparePassword(password, user.password);

      if (!isPasswordMatch) {
        throw { name: 'Unauthorized', message: 'Invalid email or password' };
      }

      const access_token = signToken({ id: user.id, email: user.email });

      res.status(200).json({ access_token });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    const { token } = req.headers;
    const client = new OAuth2Client();
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: '1050505246453-n8i7i8caqa6eq79np0lsddm12tmvcfjk.apps.googleusercontent.com',
      });
      const payload = ticket.getPayload();
      console.log(payload);

      const [user, created] = await User.findOrCreate({
        where: { email: payload.email },
        defaults: {
          name: payload.name,
          email: payload.email,
          password: 'password-google',
          dateOfBirth: new Date(),
        },
        hooks: false,
      });
      const access_token = signToken({ id: user.id, email: user.email });
      return res.status(200).json({ access_token });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
}

module.exports = UserController;
