const request = require('supertest');
const app = require('../../server/index');
const { sequelize } = require('../setup');
const { User, Company, Policy } = require('../../server/models');

describe('API Integration Tests', () => {
  let adminToken, companyToken, officerToken, cblToken, insurerToken, insuredToken;
  let testCompany, testPolicy;

  beforeAll(async () => {
    // Create test company
    testCompany = await Company.create({
      name: 'Test Insurance Company',
      license_number: 'LIC123',
      registration_number: 'REG123',
      status: 'approved',
      contact_email: 'test@company.com',
      contact_phone: '1234567890',
      address: 'Test Address',
      is_active: true
    });

    // Create test policy
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

  beforeEach(async () => {
    // Create test users and get tokens
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: '$2b$10$test.hash.for.testing',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });

    const companyUser = await User.create({
      username: 'company',
      email: 'company@example.com',
      password_hash: '$2b$10$test.hash.for.testing',
      role: 'company',
      first_name: 'Company',
      last_name: 'User',
      phone: '1234567890',
      is_active: true,
      company_id: testCompany.id
    });

    const officerUser = await User.create({
      username: 'officer',
      email: 'officer@example.com',
      password_hash: '$2b$10$test.hash.for.testing',
      role: 'officer',
      first_name: 'Officer',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });

    const cblUser = await User.create({
      username: 'cbl',
      email: 'cbl@example.com',
      password_hash: '$2b$10$test.hash.for.testing',
      role: 'cbl',
      first_name: 'CBL',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });

    const insurerUser = await User.create({
      username: 'insurer',
      email: 'insurer@example.com',
      password_hash: '$2b$10$test.hash.for.testing',
      role: 'insurer',
      first_name: 'Insurer',
      last_name: 'User',
      phone: '1234567890',
      is_active: true,
      company_id: testCompany.id
    });

    const insuredUser = await User.create({
      username: 'insured',
      email: 'insured@example.com',
      password_hash: '$2b$10$test.hash.for.testing',
      role: 'insured',
      first_name: 'Insured',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });

    // Mock JWT tokens (in real tests, you'd use actual JWT generation)
    adminToken = 'mock-admin-token';
    companyToken = 'mock-company-token';
    officerToken = 'mock-officer-token';
    cblToken = 'mock-cbl-token';
    insurerToken = 'mock-insurer-token';
    insuredToken = 'mock-insured-token';
  });

  describe('Authentication Tests', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe('admin');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/reports/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Admin API Tests', () => {
    test('should get all users (admin only)', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('should reject non-admin access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('Company API Tests', () => {
    test('should get company policies', async () => {
      const response = await request(app)
        .get('/api/reports/policies')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.policies)).toBe(true);
    });

    test('should create new policy', async () => {
      const newPolicy = {
        policy_number: 'POL456',
        holder_name: 'Jane Doe',
        holder_id_number: 'ID456',
        holder_phone: '0987654321',
        holder_email: 'jane@example.com',
        policy_type: 'health',
        coverage_amount: 20000,
        premium_amount: 1000,
        start_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        details_json: JSON.stringify({ coverage: 'comprehensive' })
      };

      const response = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${companyToken}`)
        .send(newPolicy);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.policy.policy_number).toBe('POL456');
    });
  });

  describe('Officer API Tests', () => {
    test('should get verification dashboard', async () => {
      const response = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
    });

    test('should verify document', async () => {
      const verificationData = {
        policy_id: testPolicy.id,
        verification_type: 'document',
        verification_data: JSON.stringify({ document_type: 'license' }),
        location: 'Test Location',
        notes: 'Document verified successfully'
      };

      const response = await request(app)
        .post('/api/verifications/verify')
        .set('Authorization', `Bearer ${officerToken}`)
        .send(verificationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.verification.status).toBe('verified');
    });
  });

  describe('CBL API Tests', () => {
    test('should get CBL dashboard', async () => {
      const response = await request(app)
        .get('/api/cbl/dashboard')
        .set('Authorization', `Bearer ${cblToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
    });

    test('should get companies for approval', async () => {
      const response = await request(app)
        .get('/api/cbl/companies')
        .set('Authorization', `Bearer ${cblToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.companies)).toBe(true);
    });

    test('should approve company', async () => {
      const response = await request(app)
        .post(`/api/cbl/companies/${testCompany.id}/approve`)
        .set('Authorization', `Bearer ${cblToken}`)
        .send({ reason: 'Company meets all requirements' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Insurer API Tests', () => {
    test('should get insurer dashboard', async () => {
      const response = await request(app)
        .get('/api/insurer/dashboard')
        .set('Authorization', `Bearer ${insurerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
    });

    test('should get insurer policies', async () => {
      const response = await request(app)
        .get('/api/insurer/policies')
        .set('Authorization', `Bearer ${insurerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.policies)).toBe(true);
    });

    test('should create insurer policy', async () => {
      const newPolicy = {
        holder_name: 'Insured Person',
        policy_type: 'auto',
        coverage_amount: 15000,
        premium_amount: 750,
        start_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/insurer/policies')
        .set('Authorization', `Bearer ${insurerToken}`)
        .send(newPolicy);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.policy.policy_number).toBeDefined();
    });
  });

  describe('Insured API Tests', () => {
    test('should get insured dashboard', async () => {
      const response = await request(app)
        .get('/api/insured/dashboard')
        .set('Authorization', `Bearer ${insuredToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
    });

    test('should get insured policies', async () => {
      const response = await request(app)
        .get('/api/insured/policies')
        .set('Authorization', `Bearer ${insuredToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.policies)).toBe(true);
    });

    test('should report claim', async () => {
      const claimData = {
        policy_id: testPolicy.id,
        description: 'Test claim description',
        uploads_json: JSON.stringify({ documents: ['doc1.pdf'] })
      };

      const response = await request(app)
        .post('/api/insured/claims')
        .set('Authorization', `Bearer ${insuredToken}`)
        .send(claimData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.claim.status).toBe('reported');
    });
  });

  describe('Policy Numbering Service Tests', () => {
    test('should generate unique policy numbers', async () => {
      const response = await request(app)
        .get('/api/insurer/policy-numbers/next')
        .set('Authorization', `Bearer ${insurerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.nextPolicyNumber).toBeDefined();
      expect(response.body.nextPolicyNumber).toMatch(/^POL\d{4}-\d{4}$/);
    });

    test('should get policy number statistics', async () => {
      const response = await request(app)
        .get('/api/insurer/policy-numbers/stats')
        .set('Authorization', `Bearer ${insurerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalGenerated).toBeDefined();
    });
  });

  describe('Upload Service Tests', () => {
    test('should upload single file', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.file).toBeDefined();
      expect(response.body.file.filename).toBe('test.txt');
    });

    test('should upload multiple files', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', Buffer.from('test file 1'), 'test1.txt')
        .attach('files', Buffer.from('test file 2'), 'test2.txt');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(response.body.files.length).toBe(2);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle validation errors', async () => {
      const invalidPolicy = {
        holder_name: '', // Invalid: empty name
        policy_type: 'invalid_type', // Invalid: not in enum
        coverage_amount: -1000 // Invalid: negative amount
      };

      const response = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${companyToken}`)
        .send(invalidPolicy);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should handle not found errors', async () => {
      const response = await request(app)
        .get('/api/policies/99999')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should handle server errors gracefully', async () => {
      // This would test error handling middleware
      const response = await request(app)
        .get('/api/nonexistent-route')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
