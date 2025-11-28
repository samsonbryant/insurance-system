const { Sequelize } = require('sequelize');
const path = require('path');

// Test database setup
const testDbPath = path.join(__dirname, 'test.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: testDbPath,
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
  }
});

// Global test setup
beforeAll(async () => {
  // Sync database models
  await sequelize.sync({ force: true });
});

// Global test cleanup
afterAll(async () => {
  await sequelize.close();
});

// Clean up after each test
afterEach(async () => {
  // Clear all tables
  const models = sequelize.models;
  for (const modelName in models) {
    await models[modelName].destroy({ where: {}, force: true });
  }
});

module.exports = { sequelize };
