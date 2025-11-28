const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Statement = sequelize.define('Statement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  policy_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  details_json: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'statements'
});

module.exports = Statement;


