'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add new roles to users table
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'officer', 'company', 'cbl', 'insurer', 'insured'),
      allowNull: false
    });

    // Add new columns to users table
    await queryInterface.addColumn('users', 'cbl_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'CBL registration ID for CBL users'
    });

    await queryInterface.addColumn('users', 'insurer_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Insurer registration ID for insurer users'
    });

    await queryInterface.addColumn('users', 'insured_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Insured person ID for insured users'
    });

    await queryInterface.addColumn('users', 'policy_numbers', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Array of policy numbers for insured users'
    });

    // Add new columns to companies table
    await queryInterface.addColumn('companies', 'cbl_registration_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'CBL registration ID'
    });

    await queryInterface.addColumn('companies', 'logo_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Company logo URL'
    });

    await queryInterface.addColumn('companies', 'registration_status', {
      type: Sequelize.ENUM('pending', 'approved', 'suspended', 'expired'),
      defaultValue: 'pending',
      comment: 'Registration status with CBL'
    });

    await queryInterface.addColumn('companies', 'registration_expiry', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Registration expiry date'
    });

    await queryInterface.addColumn('companies', 'suspension_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Reason for suspension'
    });

    await queryInterface.addColumn('companies', 'suspension_duration', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Suspension duration in days'
    });

    // Add new columns to policies table
    await queryInterface.addColumn('policies', 'insured_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Insured person ID'
    });

    await queryInterface.addColumn('policies', 'policy_year', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Policy year for numbering'
    });

    await queryInterface.addColumn('policies', 'policy_counter', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Policy counter for numbering'
    });

    await queryInterface.addColumn('policies', 'approval_status', {
      type: Sequelize.ENUM('pending', 'approved', 'declined'),
      defaultValue: 'pending',
      comment: 'CBL approval status'
    });

    await queryInterface.addColumn('policies', 'approval_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'CBL approval date'
    });

    await queryInterface.addColumn('policies', 'approver_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'CBL approver user ID'
    });

    // Create claims table
    await queryInterface.createTable('claims', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      policy_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'policies',
          key: 'id'
        }
      },
      insured_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      insurer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      uploads_json: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('reported', 'settled', 'denied'),
        defaultValue: 'reported'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create statements table
    await queryInterface.createTable('statements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      policy_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'policies',
          key: 'id'
        }
      },
      details_json: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create approvals table
    await queryInterface.createTable('approvals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      entity_type: {
        type: Sequelize.ENUM('insurer', 'policy', 'user', 'bond', 'type'),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'declined'),
        defaultValue: 'pending'
      },
      approver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create reference_checks table
    await queryInterface.createTable('reference_checks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      search_query: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      results_json: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create bonds table
    await queryInterface.createTable('bonds', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      policy_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'policies',
          key: 'id'
        }
      },
      bond_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('claims', ['policy_id']);
    await queryInterface.addIndex('claims', ['insured_id']);
    await queryInterface.addIndex('claims', ['insurer_id']);
    await queryInterface.addIndex('claims', ['status']);
    
    await queryInterface.addIndex('statements', ['policy_id']);
    
    await queryInterface.addIndex('approvals', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('approvals', ['status']);
    await queryInterface.addIndex('approvals', ['approver_id']);
    
    await queryInterface.addIndex('reference_checks', ['search_query']);
    
    await queryInterface.addIndex('bonds', ['policy_id']);
    await queryInterface.addIndex('bonds', ['bond_type']);
  },

  async down (queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('bonds');
    await queryInterface.dropTable('reference_checks');
    await queryInterface.dropTable('approvals');
    await queryInterface.dropTable('statements');
    await queryInterface.dropTable('claims');

    // Remove columns from policies table
    await queryInterface.removeColumn('policies', 'approver_id');
    await queryInterface.removeColumn('policies', 'approval_date');
    await queryInterface.removeColumn('policies', 'approval_status');
    await queryInterface.removeColumn('policies', 'policy_counter');
    await queryInterface.removeColumn('policies', 'policy_year');
    await queryInterface.removeColumn('policies', 'insured_id');

    // Remove columns from companies table
    await queryInterface.removeColumn('companies', 'suspension_duration');
    await queryInterface.removeColumn('companies', 'suspension_reason');
    await queryInterface.removeColumn('companies', 'registration_expiry');
    await queryInterface.removeColumn('companies', 'registration_status');
    await queryInterface.removeColumn('companies', 'logo_url');
    await queryInterface.removeColumn('companies', 'cbl_registration_id');

    // Remove columns from users table
    await queryInterface.removeColumn('users', 'policy_numbers');
    await queryInterface.removeColumn('users', 'insured_id');
    await queryInterface.removeColumn('users', 'insurer_id');
    await queryInterface.removeColumn('users', 'cbl_id');

    // Revert role enum to original values
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'officer', 'company'),
      allowNull: false
    });
  }
};
