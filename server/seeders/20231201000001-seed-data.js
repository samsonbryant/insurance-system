'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await queryInterface.bulkInsert('users', [{
      username: 'admin',
      email: 'admin@ivas.gov.lr',
      password_hash: adminPassword,
      role: 'admin',
      first_name: 'System',
      last_name: 'Administrator',
      phone: '+231-123-456-7890',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    // Fetch the inserted admin id (works for both MySQL and SQLite)
    const [admins] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='admin' LIMIT 1;");
    const adminId = Array.isArray(admins) && admins.length ? admins[0].id : admins.id || admins?.[0]?.id;

    // Create sample insurance companies
    const companies = await queryInterface.bulkInsert('companies', [
      {
        name: 'Liberia Insurance Corporation',
        license_number: 'LIC-001-2023',
        registration_number: 'REG-LIC-001',
        contact_email: 'info@lic.com.lr',
        contact_phone: '+231-456-789-0123',
        address: 'Broad Street, Monrovia, Liberia',
        status: 'approved',
        admin_approved_by: adminId,
        sync_frequency: 'daily',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'First Insurance Company',
        license_number: 'FIC-002-2023',
        registration_number: 'REG-FIC-002',
        contact_email: 'contact@firstinsurance.lr',
        contact_phone: '+231-789-012-3456',
        address: 'Tubman Boulevard, Monrovia, Liberia',
        status: 'approved',
        admin_approved_by: adminId,
        sync_frequency: 'daily',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Liberian National Insurance',
        license_number: 'LNI-003-2023',
        registration_number: 'REG-LNI-003',
        contact_email: 'support@lni.lr',
        contact_phone: '+231-012-345-6789',
        address: 'Carey Street, Monrovia, Liberia',
        status: 'pending',
        sync_frequency: 'manual',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Fetch inserted companies to get their IDs
    const [companyRows] = await queryInterface.sequelize.query("SELECT id, license_number FROM companies WHERE license_number IN ('LIC-001-2023','FIC-002-2023','LNI-003-2023');");
    const byLicense = {};
    (Array.isArray(companyRows) ? companyRows : [companyRows]).forEach(c => { byLicense[c.license_number] = c; });

    // Create company users
    const companyPassword = await bcrypt.hash('company123', 12);
    const officerPassword = await bcrypt.hash('officer123', 12);

    await queryInterface.bulkInsert('users', [
      {
        username: 'lic_manager',
        email: 'manager@lic.com.lr',
        password_hash: companyPassword,
        role: 'company',
        company_id: byLicense['LIC-001-2023'].id,
        first_name: 'John',
        last_name: 'Doe',
        phone: '+231-456-789-0124',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'fic_manager',
        email: 'manager@firstinsurance.lr',
        password_hash: companyPassword,
        role: 'company',
        company_id: byLicense['FIC-002-2023'].id,
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+231-789-012-3457',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'officer1',
        email: 'officer1@police.gov.lr',
        password_hash: officerPassword,
        role: 'officer',
        first_name: 'Michael',
        last_name: 'Johnson',
        phone: '+231-111-222-3333',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'officer2',
        email: 'officer2@police.gov.lr',
        password_hash: officerPassword,
        role: 'officer',
        first_name: 'Sarah',
        last_name: 'Williams',
        phone: '+231-444-555-6666',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Fetch officer user ids now that they exist
    const [officer1Rows] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='officer1' LIMIT 1;");
    const officer1Id = Array.isArray(officer1Rows) && officer1Rows.length ? officer1Rows[0].id : officer1Rows.id || officer1Rows?.[0]?.id;
    const [officer2Rows] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username='officer2' LIMIT 1;");
    const officer2Id = Array.isArray(officer2Rows) && officer2Rows.length ? officer2Rows[0].id : officer2Rows.id || officer2Rows?.[0]?.id;

    // Create sample policies
    const crypto = require('crypto');
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    const policies = [
      {
        policy_number: 'LIC-AUTO-001-2023',
        holder_name: 'James Brown',
        holder_id_number: 'LR123456789',
        holder_phone: '+231-777-888-9999',
        holder_email: 'james.brown@email.com',
        policy_type: 'auto',
        coverage_amount: 50000.00,
        premium_amount: 1200.00,
        start_date: today,
        expiry_date: nextYear,
        company_id: byLicense['LIC-001-2023'].id,
        status: 'active',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        policy_number: 'FIC-AUTO-002-2023',
        holder_name: 'Mary Davis',
        holder_id_number: 'LR987654321',
        holder_phone: '+231-888-999-0000',
        holder_email: 'mary.davis@email.com',
        policy_type: 'auto',
        coverage_amount: 75000.00,
        premium_amount: 1800.00,
        start_date: today,
        expiry_date: nextYear,
        company_id: byLicense['FIC-002-2023'].id,
        status: 'active',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        policy_number: 'LIC-HEALTH-003-2023',
        holder_name: 'Robert Wilson',
        holder_id_number: 'LR456789123',
        holder_phone: '+231-999-000-1111',
        holder_email: 'robert.wilson@email.com',
        policy_type: 'health',
        coverage_amount: 25000.00,
        premium_amount: 800.00,
        start_date: today,
        expiry_date: nextYear,
        company_id: byLicense['LIC-001-2023'].id,
        status: 'active',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        policy_number: 'FIC-PROPERTY-004-2023',
        holder_name: 'Lisa Anderson',
        holder_id_number: 'LR789123456',
        holder_phone: '+231-000-111-2222',
        holder_email: 'lisa.anderson@email.com',
        policy_type: 'property',
        coverage_amount: 100000.00,
        premium_amount: 2500.00,
        start_date: today,
        expiry_date: nextYear,
        company_id: byLicense['FIC-002-2023'].id,
        status: 'active',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Generate hashes for policies
    policies.forEach(policy => {
      const policyData = {
        policy_number: policy.policy_number,
        holder_name: policy.holder_name,
        expiry_date: policy.expiry_date,
        company_id: policy.company_id
      };
      policy.hash = crypto.createHash('sha256')
        .update(JSON.stringify(policyData))
        .digest('hex');
    });

    await queryInterface.bulkInsert('policies', policies);

    // Create sample verifications
    const verifications = [
      {
        policy_number: 'LIC-AUTO-001-2023',
        holder_name: 'James Brown',
        expiry_date: nextYear,
        officer_id: officer1Id, // officer1
        company_id: byLicense['LIC-001-2023'].id,
        status: 'valid',
        reason: 'Policy verified successfully',
        location: 'Monrovia, Liberia',
        latitude: 6.3000,
        longitude: -10.8000,
        verification_method: 'manual',
        confidence_score: 100.00,
        verified_at: new Date(),
        response_time_ms: 150,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        policy_number: 'FIC-AUTO-002-2023',
        holder_name: 'Mary Davis',
        expiry_date: nextYear,
        officer_id: officer2Id, // officer2
        company_id: byLicense['FIC-002-2023'].id,
        status: 'valid',
        reason: 'Policy verified successfully',
        location: 'Monrovia, Liberia',
        latitude: 6.3000,
        longitude: -10.8000,
        verification_method: 'manual',
        confidence_score: 100.00,
        verified_at: new Date(),
        response_time_ms: 120,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        policy_number: 'FAKE-POLICY-001',
        holder_name: 'Fake Holder',
        expiry_date: nextYear,
        officer_id: officer1Id, // officer1
        status: 'fake',
        reason: 'Policy not found in database',
        location: 'Monrovia, Liberia',
        latitude: 6.3000,
        longitude: -10.8000,
        verification_method: 'manual',
        confidence_score: 95.00,
        verified_at: new Date(),
        response_time_ms: 200,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('verifications', verifications);

    // Create sample audit logs
    await queryInterface.bulkInsert('audit_logs', [
      {
        user_id: adminId,
        action: 'SYSTEM_INITIALIZED',
        entity_type: 'SYSTEM',
        details: { message: 'System initialized with default data' },
        severity: 'low',
        status: 'success',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: adminId,
        action: 'COMPANY_APPROVE',
        entity_type: 'COMPANY',
        entity_id: byLicense['LIC-001-2023'].id,
        details: { company_name: 'Liberia Insurance Corporation' },
        severity: 'high',
        status: 'success',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: officer1Id,
        action: 'DOCUMENT_VERIFY',
        entity_type: 'VERIFICATION',
        entity_id: 1,
        details: { policy_number: 'LIC-AUTO-001-2023', status: 'valid' },
        severity: 'medium',
        status: 'success',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('audit_logs', null, {});
    await queryInterface.bulkDelete('verifications', null, {});
    await queryInterface.bulkDelete('policies', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('companies', null, {});
  }
};
