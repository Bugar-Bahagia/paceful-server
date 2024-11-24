'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate(models) {
      UserProfile.belongsTo(models.User);
    }
  }
  UserProfile.init(
    {
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'UserId cannot be empty',
          },
          notNull: {
            msg: 'UserId cannot be null',
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Name cannot be empty',
          },
          notNull: {
            msg: 'Name cannot be null',
          },
          len: {
            args: [3],
            msg: 'Name length must be at least 3 characters',
          },
        },
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Date of birth cannot be empty',
          },
          notNull: {
            msg: 'Date of birth cannot be null',
          },
        }
      }
    },
    {
      sequelize,
      modelName: 'UserProfile',
    }
  );
  return UserProfile;
};
