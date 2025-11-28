'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add holder_id_number column to verifications table
    await queryInterface.addColumn('verifications', 'holder_id_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'holder_name'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove holder_id_number column
    await queryInterface.removeColumn('verifications', 'holder_id_number');
  }
};

