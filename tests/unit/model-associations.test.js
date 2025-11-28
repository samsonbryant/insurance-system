const { sequelize } = require('../setup');
const { User, Company, Policy, Verification, AuditLog, Claim, Statement, Approval, ReferenceCheck, Bond } = require('../../server/models');

describe('Model Association Tests', () => {
  let testUser, testCompany, testPolicy;

  beforeEach(async () => {
    // Create test data
    testCompany = await Company.create({
      name: 'Test Company',
      license_number: 'LIC123',
      registration_number: 'REG123',
      status: 'approved',
      contact_email: 'company@example.com',
      contact_phone: '1234567890',
      address: 'Test Address',
      is_active: true
    });

    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: 'officer',
      first_name: 'Test',
      last_name: 'User',
      phone: '1234567890',
      is_active: true,
      company_id: testCompany.id
    });

    testPolicy = await Policy.create({
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
      company_id: testCompany.id,
      is_active: true,
      status: 'active'
    });
  });

  test('User-Company association', async () => {
    const userWithCompany = await User.findByPk(testUser.id, {
      include: [{ model: Company, as: 'company' }]
    });

    expect(userWithCompany.company).toBeDefined();
    expect(userWithCompany.company.id).toBe(testCompany.id);
    expect(userWithCompany.company.name).toBe('Test Company');
  });

  test('Company-Users association', async () => {
    const companyWithUsers = await Company.findByPk(testCompany.id, {
      include: [{ model: User, as: 'users' }]
    });

    expect(companyWithUsers.users).toBeDefined();
    expect(companyWithUsers.users.length).toBe(1);
    expect(companyWithUsers.users[0].id).toBe(testUser.id);
  });

  test('Policy-Company association', async () => {
    const policyWithCompany = await Policy.findByPk(testPolicy.id, {
      include: [{ model: Company, as: 'company' }]
    });

    expect(policyWithCompany.company).toBeDefined();
    expect(policyWithCompany.company.id).toBe(testCompany.id);
    expect(policyWithCompany.company.name).toBe('Test Company');
  });

  test('Company-Policies association', async () => {
    const companyWithPolicies = await Company.findByPk(testCompany.id, {
      include: [{ model: Policy, as: 'policies' }]
    });

    expect(companyWithPolicies.policies).toBeDefined();
    expect(companyWithPolicies.policies.length).toBe(1);
    expect(companyWithPolicies.policies[0].id).toBe(testPolicy.id);
  });

  test('Verification-Policy association', async () => {
    const verification = await Verification.create({
      policy_id: testPolicy.id,
      officer_id: testUser.id,
      verification_type: 'document',
      status: 'verified',
      verification_data: JSON.stringify({ verified: true }),
      location: 'Test Location',
      notes: 'Test verification'
    });

    const verificationWithPolicy = await Verification.findByPk(verification.id, {
      include: [{ model: Policy, as: 'policy' }]
    });

    expect(verificationWithPolicy.policy).toBeDefined();
    expect(verificationWithPolicy.policy.id).toBe(testPolicy.id);
    expect(verificationWithPolicy.policy.policy_number).toBe('POL123');
  });

  test('Verification-User association', async () => {
    const verification = await Verification.create({
      policy_id: testPolicy.id,
      officer_id: testUser.id,
      verification_type: 'document',
      status: 'verified',
      verification_data: JSON.stringify({ verified: true }),
      location: 'Test Location',
      notes: 'Test verification'
    });

    const verificationWithOfficer = await Verification.findByPk(verification.id, {
      include: [{ model: User, as: 'officer' }]
    });

    expect(verificationWithOfficer.officer).toBeDefined();
    expect(verificationWithOfficer.officer.id).toBe(testUser.id);
    expect(verificationWithOfficer.officer.username).toBe('testuser');
  });

  test('Claim-Policy association', async () => {
    const claim = await Claim.create({
      policy_id: testPolicy.id,
      insurer_id: testCompany.id,
      description: 'Test claim',
      status: 'reported'
    });

    const claimWithPolicy = await Claim.findByPk(claim.id, {
      include: [{ model: Policy, as: 'policy' }]
    });

    expect(claimWithPolicy.policy).toBeDefined();
    expect(claimWithPolicy.policy.id).toBe(testPolicy.id);
    expect(claimWithPolicy.policy.policy_number).toBe('POL123');
  });

  test('Statement-Policy association', async () => {
    const statement = await Statement.create({
      policy_id: testPolicy.id,
      details_json: JSON.stringify({ amount: 1000 })
    });

    const statementWithPolicy = await Statement.findByPk(statement.id, {
      include: [{ model: Policy, as: 'policy' }]
    });

    expect(statementWithPolicy.policy).toBeDefined();
    expect(statementWithPolicy.policy.id).toBe(testPolicy.id);
    expect(statementWithPolicy.policy.policy_number).toBe('POL123');
  });

  test('Bond-Policy association', async () => {
    const bond = await Bond.create({
      policy_id: testPolicy.id,
      bond_type: 'performance',
      value: 5000
    });

    const bondWithPolicy = await Bond.findByPk(bond.id, {
      include: [{ model: Policy, as: 'policy' }]
    });

    expect(bondWithPolicy.policy).toBeDefined();
    expect(bondWithPolicy.policy.id).toBe(testPolicy.id);
    expect(bondWithPolicy.policy.policy_number).toBe('POL123');
  });

  test('Cascade delete operations', async () => {
    // Create verification
    const verification = await Verification.create({
      policy_id: testPolicy.id,
      officer_id: testUser.id,
      verification_type: 'document',
      status: 'verified',
      verification_data: JSON.stringify({ verified: true }),
      location: 'Test Location',
      notes: 'Test verification'
    });

    // Create claim
    const claim = await Claim.create({
      policy_id: testPolicy.id,
      insurer_id: testCompany.id,
      description: 'Test claim',
      status: 'reported'
    });

    // Create statement
    const statement = await Statement.create({
      policy_id: testPolicy.id,
      details_json: JSON.stringify({ amount: 1000 })
    });

    // Create bond
    const bond = await Bond.create({
      policy_id: testPolicy.id,
      bond_type: 'performance',
      value: 5000
    });

    // Delete policy - should cascade to related records
    await Policy.destroy({ where: { id: testPolicy.id } });

    // Verify cascade deletes
    const deletedVerification = await Verification.findByPk(verification.id);
    const deletedClaim = await Claim.findByPk(claim.id);
    const deletedStatement = await Statement.findByPk(statement.id);
    const deletedBond = await Bond.findByPk(bond.id);

    expect(deletedVerification).toBeNull();
    expect(deletedClaim).toBeNull();
    expect(deletedStatement).toBeNull();
    expect(deletedBond).toBeNull();
  });

  test('Foreign key constraints', async () => {
    // Try to create verification with non-existent policy
    await expect(
      Verification.create({
        policy_id: 99999,
        officer_id: testUser.id,
        verification_type: 'document',
        status: 'verified',
        verification_data: JSON.stringify({ verified: true }),
        location: 'Test Location',
        notes: 'Test verification'
      })
    ).rejects.toThrow();

    // Try to create claim with non-existent policy
    await expect(
      Claim.create({
        policy_id: 99999,
        insurer_id: testCompany.id,
        description: 'Test claim',
        status: 'reported'
      })
    ).rejects.toThrow();
  });
});
