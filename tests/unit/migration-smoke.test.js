const { sequelize } = require('../setup');
const { User, Company, Policy, Verification, AuditLog, Claim, Statement, Approval, ReferenceCheck, Bond } = require('../../server/models');

describe('Migration Smoke Tests', () => {
  test('should create all required tables', async () => {
    // Test User table
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: 'admin',
      first_name: 'Test',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });
    expect(user.id).toBeDefined();
    expect(user.username).toBe('testuser');

    // Test Company table
    const company = await Company.create({
      name: 'Test Company',
      license_number: 'LIC123',
      registration_number: 'REG123',
      status: 'approved',
      contact_email: 'company@example.com',
      contact_phone: '1234567890',
      address: 'Test Address',
      is_active: true
    });
    expect(company.id).toBeDefined();
    expect(company.name).toBe('Test Company');

    // Test Policy table
    const policy = await Policy.create({
      policy_number: 'POL123',
      holder_name: 'John Doe',
      holder_id_number: 'ID123',
      holder_phone: '1234567890',
      holder_email: 'john@example.com',
      policy_type: 'auto',
      coverage_amount: 10000,
      premium_amount: 500,
      start_date: new Date(),
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      hash: 'policyhash',
      company_id: company.id,
      is_active: true,
      status: 'active'
    });
    expect(policy.id).toBeDefined();
    expect(policy.policy_number).toBe('POL123');

    // Test Verification table
    const verification = await Verification.create({
      policy_id: policy.id,
      officer_id: user.id,
      verification_type: 'document',
      status: 'verified',
      verification_data: JSON.stringify({ verified: true }),
      location: 'Test Location',
      notes: 'Test verification'
    });
    expect(verification.id).toBeDefined();
    expect(verification.status).toBe('verified');

    // Test AuditLog table
    const auditLog = await AuditLog.create({
      user_id: user.id,
      action: 'test_action',
      entity_type: 'test',
      details: JSON.stringify({ test: true }),
      ip_address: '127.0.0.1',
      user_agent: 'test-agent',
      severity: 'info',
      status: 'success'
    });
    expect(auditLog.id).toBeDefined();
    expect(auditLog.action).toBe('test_action');

    // Test new tables
    const claim = await Claim.create({
      policy_id: policy.id,
      insurer_id: company.id,
      description: 'Test claim',
      status: 'reported'
    });
    expect(claim.id).toBeDefined();
    expect(claim.description).toBe('Test claim');

    const statement = await Statement.create({
      policy_id: policy.id,
      details_json: JSON.stringify({ amount: 1000 })
    });
    expect(statement.id).toBeDefined();

    const approval = await Approval.create({
      entity_type: 'policy',
      entity_id: policy.id,
      status: 'pending'
    });
    expect(approval.id).toBeDefined();
    expect(approval.status).toBe('pending');

    const referenceCheck = await ReferenceCheck.create({
      search_query: 'test query',
      results_json: JSON.stringify({ results: [] })
    });
    expect(referenceCheck.id).toBeDefined();
    expect(referenceCheck.search_query).toBe('test query');

    const bond = await Bond.create({
      policy_id: policy.id,
      bond_type: 'performance',
      value: 5000
    });
    expect(bond.id).toBeDefined();
    expect(bond.bond_type).toBe('performance');
  });

  test('should handle new role enum values', async () => {
    const roles = ['admin', 'company', 'officer', 'cbl', 'insurer', 'insured'];
    
    for (const role of roles) {
      const user = await User.create({
        username: `test_${role}`,
        email: `test_${role}@example.com`,
        password_hash: 'hashedpassword',
        role: role,
        first_name: 'Test',
        last_name: 'User',
        phone: '1234567890',
        is_active: true
      });
      expect(user.role).toBe(role);
    }
  });

  test('should handle new policy columns', async () => {
    const company = await Company.create({
      name: 'Test Company',
      license_number: 'LIC123',
      registration_number: 'REG123',
      status: 'approved',
      contact_email: 'company@example.com',
      contact_phone: '1234567890',
      address: 'Test Address',
      is_active: true
    });

    const policy = await Policy.create({
      policy_number: 'POL123',
      holder_name: 'John Doe',
      policy_type: 'auto',
      coverage_amount: 10000,
      premium_amount: 500,
      start_date: new Date(),
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      hash: 'policyhash',
      company_id: company.id,
      is_active: true,
      status: 'active',
      // New columns
      insured_id: 1,
      policy_year: 2025,
      policy_counter: 1,
      approval_status: 'approved',
      approval_date: new Date(),
      approver_id: 1
    });

    expect(policy.insured_id).toBe(1);
    expect(policy.policy_year).toBe(2025);
    expect(policy.policy_counter).toBe(1);
    expect(policy.approval_status).toBe('approved');
    expect(policy.approver_id).toBe(1);
  });

  test('should handle new user columns', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: 'insurer',
      first_name: 'Test',
      last_name: 'User',
      phone: '1234567890',
      is_active: true,
      // New columns
      cbl_id: 1,
      insurer_id: 2,
      insured_id: 3,
      policy_numbers: JSON.stringify(['POL001', 'POL002'])
    });

    expect(user.cbl_id).toBe(1);
    expect(user.insurer_id).toBe(2);
    expect(user.insured_id).toBe(3);
    expect(JSON.parse(user.policy_numbers)).toEqual(['POL001', 'POL002']);
  });
});
