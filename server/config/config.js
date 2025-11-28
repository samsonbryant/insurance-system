const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const common = {
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

function envConfig(envName) {
  const dialect = process.env.DB_DIALECT || 'mysql';
  if (dialect === 'sqlite') {
    return {
      dialect: 'sqlite',
      storage: process.env.SQLITE_STORAGE || path.resolve(__dirname, '../dev.sqlite'),
      ...common
    };
  }

  return {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: envName === 'test' ? (process.env.DB_NAME_TEST || 'ivas_db_test') : (process.env.DB_NAME || 'ivas_db'),
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    ...common
  };
}

module.exports = {
  development: envConfig('development'),
  test: envConfig('test'),
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
