'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add coverage_type column to policies table
    await queryInterface.addColumn('policies', 'coverage_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Coverage type: treaty, facultative, or co_insured'
    });

    // Add reinsurance_number column to policies table
    await queryInterface.addColumn('policies', 'reinsurance_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Reinsurance number for the policy'
    });

    // Add index on coverage_type for faster filtering
    await queryInterface.addIndex('policies', ['coverage_type'], {
      name: 'policies_coverage_type_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex('policies', 'policies_coverage_type_idx');
    
    // Remove columns
    await queryInterface.removeColumn('policies', 'reinsurance_number');
    await queryInterface.removeColumn('policies', 'coverage_type');
  }
};

