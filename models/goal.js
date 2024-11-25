'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Goal extends Model {
    static associate(models) {
      Goal.belongsTo(models.User);
    }
  }
  Goal.init(
    {
      UserId: DataTypes.INTEGER,
      typeName: {
        type: DataTypes.ENUM,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Type of activity cannot be empty',
          },
          notNull: {
            msg: 'Type of activity cannot be null',
          },
          isIn: { args: [['steps', 'distance', 'calories burned', 'duration']], msg: 'Must be steps/distance/calories burned/duration' },
        },
      },
      targetValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'You should set your goal',
          },
          notNull: {
            msg: 'You should set your goal',
          },
        },
      },
      currentValue: DataTypes.INTEGER,
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'You should set your starting date',
          },
          notNull: {
            msg: 'You should set your starting date',
          },
        },
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'You should let us know when will you end your goal',
          },
          notNull: {
            msg: 'You should let us know when will you end your goal',
          },
        },
      },
      isAchieved: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      sequelize,
      modelName: 'Goal',
    }
  );
  return Goal;
};
