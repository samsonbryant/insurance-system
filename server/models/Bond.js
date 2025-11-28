const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bond = sequelize.define('Bond', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  policy_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bond_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  }
}, {
  tableName: 'bonds'
});

module.exports = Bond;


