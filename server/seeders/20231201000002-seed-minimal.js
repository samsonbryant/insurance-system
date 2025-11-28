'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Admin (idempotent)
    const [adminRowsPre] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='admin' LIMIT 1;");
    if (!(Array.isArray(adminRowsPre) && adminRowsPre.length)) {
      const adminHash = await bcrypt.hash('admin123', 12);
      await queryInterface.bulkInsert('users', [{
        username: 'admin',
        email: 'admin@ivas.gov.lr',
        password_hash: adminHash,
        role: 'admin',
        first_name: 'System',
        last_name: 'Administrator',
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
    const [adminRows] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='admin' LIMIT 1;");
    const adminId = Array.isArray(adminRows) && adminRows.length ? adminRows[0].id : adminRows.id || adminRows?.[0]?.id;

    // Companies (idempotent)
    const [licRows] = await queryInterface.sequelize.query("SELECT id FROM companies WHERE license_number='LIC-001-2023' LIMIT 1;");
    if (!(Array.isArray(licRows) && licRows.length)) {
      await queryInterface.bulkInsert('companies', [{
        name: 'Liberia Insurance Corporation',
        license_number: 'LIC-001-2023',
        contact_email: 'info@lic.com.lr',
        status: 'approved',
        admin_approved_by: adminId,
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
    const [ficRows] = await queryInterface.sequelize.query("SELECT id FROM companies WHERE license_number='FIC-002-2023' LIMIT 1;");
    if (!(Array.isArray(ficRows) && ficRows.length)) {
      await queryInterface.bulkInsert('companies', [{
        name: 'First Insurance Company',
        license_number: 'FIC-002-2023',
        contact_email: 'contact@firstinsurance.lr',
        status: 'approved',
        admin_approved_by: adminId,
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }

    const [companyRows] = await queryInterface.sequelize.query("SELECT id, license_number FROM companies WHERE license_number IN ('LIC-001-2023','FIC-002-2023');");
    const compByLic = {};
    (Array.isArray(companyRows) ? companyRows : [companyRows]).forEach(c => { compByLic[c.license_number] = c; });

    // Officers (idempotent)
    const [off1Exists] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='officer1' LIMIT 1;");
    if (!(Array.isArray(off1Exists) && off1Exists.length)) {
      const officerHash = await bcrypt.hash('officer123', 12);
      await queryInterface.bulkInsert('users', [{
        username: 'officer1',
        email: 'officer1@police.gov.lr',
        password_hash: officerHash,
        role: 'officer',
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
    const [off2Exists] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='officer2' LIMIT 1;");
    if (!(Array.isArray(off2Exists) && off2Exists.length)) {
      const officerHash = await bcrypt.hash('officer123', 12);
      await queryInterface.bulkInsert('users', [{
        username: 'officer2',
        email: 'officer2@police.gov.lr',
        password_hash: officerHash,
        role: 'officer',
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }

    const [off1Rows] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='officer1' LIMIT 1;");
    const [off2Rows] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='officer2' LIMIT 1;");
    const off1Id = Array.isArray(off1Rows) && off1Rows.length ? off1Rows[0].id : off1Rows.id || off1Rows?.[0]?.id;
    const off2Id = Array.isArray(off2Rows) && off2Rows.length ? off2Rows[0].id : off2Rows.id || off2Rows?.[0]?.id;

    // Policies
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    const [pol1] = await queryInterface.sequelize.query("SELECT policy_number FROM policies WHERE policy_number='LIC-AUTO-001-2023' LIMIT 1;");
    if (!(Array.isArray(pol1) && pol1.length)) {
      await queryInterface.bulkInsert('policies', [{
        policy_number: 'LIC-AUTO-001-2023',
        holder_name: 'James Brown',
        policy_type: 'auto',
        start_date: today,
        expiry_date: nextYear,
        company_id: compByLic['LIC-001-2023'].id,
        status: 'active',
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date(),
        hash: 'seedhash1'.padEnd(64, '0')
      }]);
    }
    const [pol2] = await queryInterface.sequelize.query("SELECT policy_number FROM policies WHERE policy_number='FIC-AUTO-002-2023' LIMIT 1;");
    if (!(Array.isArray(pol2) && pol2.length)) {
      await queryInterface.bulkInsert('policies', [{
        policy_number: 'FIC-AUTO-002-2023',
        holder_name: 'Mary Davis',
        policy_type: 'auto',
        start_date: today,
        expiry_date: nextYear,
        company_id: compByLic['FIC-002-2023'].id,
        status: 'active',
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date(),
        hash: 'seedhash2'.padEnd(64, '0')
      }]);
    }

    // Verifications
    const [ver1] = await queryInterface.sequelize.query("SELECT id FROM verifications WHERE policy_number='LIC-AUTO-001-2023' LIMIT 1;");
    if (!(Array.isArray(ver1) && ver1.length)) {
      await queryInterface.bulkInsert('verifications', [{
        policy_number: 'LIC-AUTO-001-2023',
        holder_name: 'James Brown',
        expiry_date: nextYear,
        officer_id: off1Id,
        company_id: compByLic['LIC-001-2023'].id,
        status: 'valid',
        verified_at: new Date(),
        response_time_ms: 100,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
    const [ver2] = await queryInterface.sequelize.query("SELECT id FROM verifications WHERE policy_number='FIC-AUTO-002-2023' LIMIT 1;");
    if (!(Array.isArray(ver2) && ver2.length)) {
      await queryInterface.bulkInsert('verifications', [{
        policy_number: 'FIC-AUTO-002-2023',
        holder_name: 'Mary Davis',
        expiry_date: nextYear,
        officer_id: off2Id,
        company_id: compByLic['FIC-002-2023'].id,
        status: 'valid',
        verified_at: new Date(),
        response_time_ms: 110,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('verifications', null, {});
    await queryInterface.bulkDelete('policies', null, {});
    await queryInterface.bulkDelete('users', { username: ['admin', 'officer1', 'officer2'] }, {});
    await queryInterface.bulkDelete('companies', { license_number: ['LIC-001-2023', 'FIC-002-2023'] }, {});
  }
};


