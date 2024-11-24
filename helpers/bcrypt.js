const bcrypt = require('bcrypt');

function hashPassword(myPlaintextPassword) {
  return bcrypt.hashSync(myPlaintextPassword, 10);
}

function comparePassword(myPlaintextPassword, hash) {
  return bcrypt.compareSync(myPlaintextPassword, hash);
}

module.exports = { hashPassword, comparePassword };
