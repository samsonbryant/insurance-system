'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'company', 'officer'),
        allowNull: false,
        defaultValue: 'officer'
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('companies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      license_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      registration_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      api_endpoint: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      api_key: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      api_secret: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'suspended', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      admin_approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      contact_email: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sync_frequency: {
        type: Sequelize.ENUM('realtime', 'hourly', 'daily', 'weekly', 'manual'),
        defaultValue: 'daily'
      },
      last_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sync_status: {
        type: Sequelize.ENUM('success', 'failed', 'pending'),
        allowNull: true
      },
      sync_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('policies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      policy_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      holder_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      holder_id_number: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      holder_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      holder_email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      policy_type: {
        type: Sequelize.ENUM('auto', 'health', 'life', 'property', 'business', 'other'),
        allowNull: false,
        defaultValue: 'auto'
      },
      coverage_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      premium_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      details_json: {
        type: Sequelize.JSON,
        allowNull: true
      },
      hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      last_synced: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'cancelled', 'suspended'),
        defaultValue: 'active'
      },
      vehicle_info: {
        type: Sequelize.JSON,
        allowNull: true
      },
      additional_beneficiaries: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('verifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      policy_number: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      holder_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      officer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('valid', 'fake', 'pending', 'expired', 'not_found'),
        allowNull: false,
        defaultValue: 'pending'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      verification_method: {
        type: Sequelize.ENUM('scan', 'manual', 'api'),
        allowNull: false,
        defaultValue: 'manual'
      },
      document_image: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      confidence_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      additional_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      response_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('audit_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'low'
      },
      status: {
        type: Sequelize.ENUM('success', 'failed', 'warning'),
        defaultValue: 'success'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['company_id']);

    await queryInterface.addIndex('companies', ['license_number']);
    await queryInterface.addIndex('companies', ['status']);
    await queryInterface.addIndex('companies', ['is_active']);

    await queryInterface.addIndex('policies', ['policy_number']);
    await queryInterface.addIndex('policies', ['company_id']);
    await queryInterface.addIndex('policies', ['expiry_date']);
    await queryInterface.addIndex('policies', ['status']);

    await queryInterface.addIndex('verifications', ['policy_number']);
    await queryInterface.addIndex('verifications', ['officer_id']);
    await queryInterface.addIndex('verifications', ['company_id']);
    await queryInterface.addIndex('verifications', ['status']);
    await queryInterface.addIndex('verifications', ['created_at']);

    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('verifications');
    await queryInterface.dropTable('policies');
    await queryInterface.dropTable('companies');
    await queryInterface.dropTable('users');
  }
};
