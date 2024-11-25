const {User} = require("../models");
const { verifyToken } = require('../helpers/jwt');


module.exports = async function authentication(req, res, next) {
  // console.log(req.headers, '<<headers');
  const bearerToken = req.headers.authorization
  if(!bearerToken){
    return res.status(401).json({ message: 'Unauthorized Error'})
  }

  const [, token ] = bearerToken.split(" ");
  console.log({token}, "ini token");

  if(!token){
    return res.status(401).json({ message: 'Invalid token'})
  }
  
  try{
  const data = verifyToken(token)

  const user = await User.findByPk(data.id)
  
  if(!user){
    return res.status(401).json({ message: "Invalid Token"})
  }

  req.user = user;

  next()

  } catch (error) {
  next(error)
  }

}