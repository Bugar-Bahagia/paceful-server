const { defaults } = require('pg');
const { comparePassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');
const { User, UserProfile } = require('../models');
const { sequelize } = require('../models');
const { OAuth2Client } = require('google-auth-library');


module.exports = class AuthController {
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
      // console.error(error);
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

      // console.log(user);

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
      // console.log(error);
      next(error);
    }
  }


  static async googleLogin(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1]

    // console.log(req.headers.authorization);
    
    if (!token) {
      return res.status(400).json({ message: "Token is required" })
    }
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      const payload = ticket.getPayload()

      if (!payload.email || !payload.name) {
        throw { name: "BadRequest", message: "Invalid Google token payload" };
      }
      // console.log(payload)

      const result = await sequelize.transaction(async (t) => {
        const [user, created] = await User.findOrCreate({
          where: { email: payload.email },
          defaults: { 
            email: payload.email,
            password: 'password-google',
          },
          transaction: t,
          hooks: false,
        })

        const userProfile = await UserProfile.findOrCreate({
          where: { name: payload.name},
          defaults: {
            name: payload.name,
            dateOfBirth: new Date(),
            UserId: user.id
          },
          transaction: t
        })

        return { user, userProfile}
      })

      const { user } = result;
      
      const access_token = signToken({ id: user.id, email: user.email })
      return res.status(200).json({ access_token })
    } catch (error) {
      // console.log(err)
      next(error)
    }
  }

  
}


