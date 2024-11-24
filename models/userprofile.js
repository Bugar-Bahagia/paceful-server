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
      UserId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      dateOfBirth: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'UserProfile',
    }
  );
  return UserProfile;
};
