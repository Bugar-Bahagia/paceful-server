'use strict';
const { Model } = require('sequelize');
const { hashPassword } = require('../helpers/bcrypt');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Goal);
      User.hasMany(models.Activity);
      User.hasOne(models.UserProfile);
    }
  }
  User.init(
    {
      email: DataTypes.STRING,
      password: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'User',
    }
  );
  User.beforeCreate((user) => {
    const hashedPassword = hashPassword(user.password);
    user.password = hashedPassword;
  });
  return User;
};
