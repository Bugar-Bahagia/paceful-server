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
      UserId: DataTypes.INTEGER,
      typeName: DataTypes.STRING,
      duration: DataTypes.INTEGER,
      distance: DataTypes.INTEGER,
      caloriesBurned: DataTypes.INTEGER,
      activityDate: DataTypes.DATE,
      notes: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Activity',
    }
  );
  return Activity;
};
