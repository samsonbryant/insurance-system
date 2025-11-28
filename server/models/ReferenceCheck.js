const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReferenceCheck = sequelize.define('ReferenceCheck', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  search_query: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  results_json: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'reference_checks'
});

module.exports = ReferenceCheck;


