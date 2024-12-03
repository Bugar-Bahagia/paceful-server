'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Activities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      UserId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'Users',
          },
          key: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      typeName: {
        type: Sequelize.ENUM,
        values: ['running', 'cycling', 'hiking', 'walking', 'swimming'],
      },
      duration: {
        type: Sequelize.INTEGER,
      },
      distance: {
        type: Sequelize.INTEGER,
      },
      caloriesBurned: {
        type: Sequelize.INTEGER,
      },
      activityDate: {
        type: Sequelize.DATE,
      },
      notes: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Activities');
  },
};
