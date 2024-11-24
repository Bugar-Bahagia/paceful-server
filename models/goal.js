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
      typeName: DataTypes.STRING,
      targetValue: DataTypes.INTEGER,
      currentValue: DataTypes.INTEGER,
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      isAchieved: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'Goal',
    }
  );
  return Goal;
};
