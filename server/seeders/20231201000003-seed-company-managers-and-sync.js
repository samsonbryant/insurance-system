'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Look up companies by license
    const [companies] = await queryInterface.sequelize.query("SELECT id, license_number, name FROM companies WHERE license_number IN ('LIC-001-2023','FIC-002-2023');");
    const byLic = {};
    (Array.isArray(companies) ? companies : [companies]).forEach(c => { byLic[c.license_number] = c; });

    // Add company managers if not present
    const [licMgr] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='lic_manager' LIMIT 1;");
    if (!(Array.isArray(licMgr) && licMgr.length)) {
      const hash = await bcrypt.hash('company123', 12);
      await queryInterface.bulkInsert('users', [{
        username: 'lic_manager',
        email: 'manager@lic.com.lr',
        password_hash: hash,
        role: 'company',
        company_id: byLic['LIC-001-2023']?.id || null,
        first_name: 'John',
        last_name: 'Doe',
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }

    const [ficMgr] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='fic_manager' LIMIT 1;");
    if (!(Array.isArray(ficMgr) && ficMgr.length)) {
      const hash = await bcrypt.hash('company123', 12);
      await queryInterface.bulkInsert('users', [{
        username: 'fic_manager',
        email: 'manager@firstinsurance.lr',
        password_hash: hash,
        role: 'company',
        company_id: byLic['FIC-002-2023']?.id || null,
        first_name: 'Jane',
        last_name: 'Smith',
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }

    // Add two audit log entries to simulate syncs
    const [admin] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='admin' LIMIT 1;");
    const adminId = Array.isArray(admin) && admin.length ? admin[0].id : admin.id || admin?.[0]?.id;

    await queryInterface.bulkInsert('audit_logs', [
      {
        user_id: adminId,
        action: 'POLICY_SYNC',
        entity_type: 'POLICY',
        entity_id: byLic['LIC-001-2023']?.id || null,
        details: JSON.stringify({ company: 'Liberia Insurance Corporation', policies_count: 2, results: { created: 2, updated: 0 } }),
        severity: 'medium',
        status: 'success',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: adminId,
        action: 'POLICY_SYNC',
        entity_type: 'POLICY',
        entity_id: byLic['FIC-002-2023']?.id || null,
        details: JSON.stringify({ company: 'First Insurance Company', policies_count: 2, results: { created: 2, updated: 0 } }),
        severity: 'medium',
        status: 'success',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('audit_logs', { action: 'POLICY_SYNC' }, {});
    await queryInterface.bulkDelete('users', { username: ['lic_manager', 'fic_manager'] }, {});
  }
};
