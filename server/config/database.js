const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Allow SQLite fallback in development by setting DB_DIALECT=sqlite
let sequelize;

if (
  (process.env.NODE_ENV === 'development' || process.env.USE_SQLITE === 'true') &&
  (process.env.DB_DIALECT === 'sqlite' || process.env.USE_SQLITE === 'true')
) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || path.resolve(__dirname, '../dev.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    timezone: '+00:00'
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ivas_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      },
      timezone: '+00:00'
    }
  );
}

module.exports = sequelize;
