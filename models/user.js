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
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Email cannot be empty',
          },
          notNull: {
            msg: 'Email cannot be null',
          },
          isEmail: {
            msg: 'Invalid email format',
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Password cannot be empty',
          },
          notNull: {
            msg: 'Password cannot be null',
          },
          len: {
            args: [6],
            msg: 'Password length must be at least 6 characters',
          },
        },
      }
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
