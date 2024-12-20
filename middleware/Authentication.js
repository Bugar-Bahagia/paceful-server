const { User } = require('../models');
const { verifyToken } = require('../helpers/jwt');

module.exports = async function authentication(req, res, next) {
  // console.log(req.headers, '<<headers');
  try {
    const bearerToken = req.headers.authorization;
    if (!bearerToken) {
      throw { name: 'JsonWebTokenError' };
    }

    const [, token] = bearerToken.split(' ');
    // console.log({ token }, 'ini token');

    if (!token) {
      throw { name: 'JsonWebTokenError' };
    }
    const data = verifyToken(token);
    const user = await User.findByPk(data.id);
    if (!user) {
      throw { name: "NotFound", message: "Profile not found" };
    }
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
