'use strict';

const { createAvatar } = require('@dicebear/avatars');
const style = require('@dicebear/avatars-initials-sprites');
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
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true, 
      },
    },
    {
      sequelize,
      modelName: 'UserProfile',
    }
  );
  
  UserProfile.beforeCreate((userProfile) => {
    if (!userProfile.avatar) {
      const seed = userProfile.name || Math.random().toString(36).substr(2, 5); 
      const style = 'adventurer-neutral';
      userProfile.avatar = `https://api.dicebear.com/6.x/${style}/svg?seed=${seed}`; 
    }
  });

  return UserProfile;
  
};

