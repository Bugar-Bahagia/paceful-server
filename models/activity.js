'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Activity extends Model {
    static associate(models) {
      Activity.belongsTo(models.User);
    }
  }
  Activity.init(
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
      typeName: {
        type: DataTypes.ENUM,
        values: ['running', 'cycling', 'hiking', 'walking', 'swimming'],
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Type of activity cannot be empty',
          },
          notNull: {
            msg: 'Type of activity cannot be null',
          },
          isIn: { args: [['running', 'cycling', 'hiking', 'walking', 'swimming']], msg: 'Must be running/cycling/hiking/walking/swimming' },
        },
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Duration cannot be empty',
          },
          notNull: {
            msg: 'Duration cannot be null',
          },
        },
      },
      distance: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Distance cannot be empty',
          },
          notNull: {
            msg: 'Distance cannot be null',
          },
        },
      },
      caloriesBurned: DataTypes.INTEGER,
      activityDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Activity date cannot be empty',
          },
          notNull: {
            msg: 'Activity date cannot be null',
          },
          isBefore(value) {
            if (new Date(value) > new Date()) {
              throw new Error('Activity date must be maximum today');
            }
          },
        },
      },
      notes: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Activity',
    }
  );
  return Activity;
};
