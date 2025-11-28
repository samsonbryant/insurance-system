const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Claim = sequelize.define('Claim', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  policy_id: {
    type: DataTypes.INTEGER,
    allowNull: true // Allow null for public claims where policy might not be found
  },
  insured_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  insurer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  uploads_json: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('reported', 'settled', 'denied'),
    defaultValue: 'reported'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  insurance_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  attachment_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'claims'
});

module.exports = Claim;


