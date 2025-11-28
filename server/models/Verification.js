const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Verification = sequelize.define('Verification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  policy_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  holder_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  officer_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for public verifications
    references: {
      model: 'users',
      key: 'id'
    }
  },
  holder_id_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('valid', 'fake', 'pending', 'expired', 'not_found'),
    allowNull: false,
    defaultValue: 'pending'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  verification_method: {
    type: DataTypes.ENUM('scan', 'manual', 'api'),
    allowNull: false,
    defaultValue: 'manual'
  },
  document_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  confidence_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  additional_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  response_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'verifications'
});

module.exports = Verification;
