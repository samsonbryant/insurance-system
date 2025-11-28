const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  license_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  registration_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  api_endpoint: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  api_key: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  api_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'suspended', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  admin_approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  contact_email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sync_frequency: {
    type: DataTypes.ENUM('realtime', 'hourly', 'daily', 'weekly', 'manual'),
    defaultValue: 'daily'
  },
  last_sync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sync_status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    allowNull: true
  },
  sync_error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'companies'
});

module.exports = Company;
