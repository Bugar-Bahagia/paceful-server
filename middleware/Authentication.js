const { User } = require('../models');
const { verifyToken } = require('../helpers/jwt');

module.exports = async function authentication(req, res, next) {
  // console.log(req.headers, '<<headers');
  const bearerToken = req.headers.authorization;
  if (!bearerToken) {
    throw { name: 'JsonWebTokenError' };
  }

  const [, token] = bearerToken.split(' ');
  console.log({ token }, 'ini token');

  if (!token) {
    throw { name: 'JsonWebTokenError'};
  }

  try {
    const data = verifyToken(token);
    const user = await User.findByPk(data.id);
    if (!user) {
      throw { name: 'JsonWebTokenError' };
    }
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
