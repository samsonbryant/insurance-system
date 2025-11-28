const request = require('supertest');
const app = require('../../server/index');
const { sequelize } = require('../setup');
const { User, Company, Policy, Verification, Claim } = require('../../server/models');

describe('E2E Golden Path Tests', () => {
  let adminToken, companyToken, officerToken, insurerToken, insuredToken;
  let testCompany, testPolicy, testUser;

  beforeAll(async () => {
    // Create test company
    testCompany = await Company.create({
      name: 'Golden Path Insurance Company',
      license_number: 'LIC-GP-001',
      registration_number: 'REG-GP-001',
      status: 'approved',
      contact_email: 'goldenpath@company.com',
      contact_phone: '1234567890',
      address: 'Golden Path Address',
      is_active: true
    });
  });

  beforeEach(async () => {
    // Clean up previous test data
    await Verification.destroy({ where: {} });
    await Claim.destroy({ where: {} });
    await Policy.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create test users
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

    // Mock tokens
    adminToken = 'mock-admin-token';
    companyToken = 'mock-company-token';
    officerToken = 'mock-officer-token';
    insurerToken = 'mock-insurer-token';
    insuredToken = 'mock-insured-token';
  });

  describe('Complete Insurance Verification Flow', () => {
    test('should complete full insurance verification workflow', async () => {
      // Step 1: Admin creates a company
      const companyResponse = await request(app)
        .post('/api/admin/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Insurance Company',
          license_number: 'LIC-E2E-001',
          registration_number: 'REG-E2E-001',
          contact_email: 'e2e@company.com',
          contact_phone: '1234567890',
          address: 'E2E Test Address'
        });

      expect(companyResponse.status).toBe(201);
      const createdCompany = companyResponse.body.company;

      // Step 2: Company creates a policy
      const policyResponse = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          policy_number: 'POL-E2E-001',
          holder_name: 'John E2E Doe',
          holder_id_number: 'ID-E2E-001',
          holder_phone: '1234567890',
          holder_email: 'john.e2e@example.com',
          policy_type: 'auto',
          coverage_amount: 25000,
          premium_amount: 1250,
          start_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          details_json: JSON.stringify({
            vehicle_make: 'Toyota',
            vehicle_model: 'Camry',
            vehicle_year: 2023,
            license_plate: 'E2E-001'
          })
        });

      expect(policyResponse.status).toBe(201);
      const createdPolicy = policyResponse.body.policy;

      // Step 3: Officer verifies the policy document
      const verificationResponse = await request(app)
        .post('/api/verifications/verify')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          policy_id: createdPolicy.id,
          verification_type: 'document',
          verification_data: JSON.stringify({
            document_type: 'insurance_certificate',
            document_number: 'DOC-E2E-001',
            verified_fields: ['policy_number', 'holder_name', 'coverage_amount']
          }),
          location: 'E2E Test Location',
          notes: 'Document verified successfully in E2E test'
        });

      expect(verificationResponse.status).toBe(201);
      const createdVerification = verificationResponse.body.verification;
      expect(createdVerification.status).toBe('verified');

      // Step 4: Insured reports a claim
      const claimResponse = await request(app)
        .post('/api/insured/claims')
        .set('Authorization', `Bearer ${insuredToken}`)
        .send({
          policy_id: createdPolicy.id,
          description: 'E2E test claim - vehicle accident',
          uploads_json: JSON.stringify({
            documents: ['accident_report.pdf', 'damage_photos.jpg'],
            description: 'Accident occurred during E2E testing'
          })
        });

      expect(claimResponse.status).toBe(201);
      const createdClaim = claimResponse.body.claim;
      expect(createdClaim.status).toBe('reported');

      // Step 5: Insurer processes the claim
      const claimProcessingResponse = await request(app)
        .put(`/api/insurer/claims/${createdClaim.id}/settle`)
        .set('Authorization', `Bearer ${insurerToken}`)
        .send({
          settlement_amount: 15000,
          reason: 'Claim approved after E2E verification'
        });

      expect(claimProcessingResponse.status).toBe(200);
      expect(claimProcessingResponse.body.claim.status).toBe('settled');

      // Step 6: Verify all data integrity
      const finalPolicyResponse = await request(app)
        .get(`/api/policies/${createdPolicy.id}`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(finalPolicyResponse.status).toBe(200);
      expect(finalPolicyResponse.body.policy.id).toBe(createdPolicy.id);

      const finalVerificationResponse = await request(app)
        .get(`/api/verifications/${createdVerification.id}`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(finalVerificationResponse.status).toBe(200);
      expect(finalVerificationResponse.body.verification.status).toBe('verified');

      const finalClaimResponse = await request(app)
        .get(`/api/insured/claims/${createdClaim.id}`)
        .set('Authorization', `Bearer ${insuredToken}`);

      expect(finalClaimResponse.status).toBe(200);
      expect(finalClaimResponse.body.claim.status).toBe('settled');
    });

    test('should handle policy creation with auto-generated policy numbers', async () => {
      // Create policy without policy_number to test auto-generation
      const policyResponse = await request(app)
        .post('/api/insurer/policies')
        .set('Authorization', `Bearer ${insurerToken}`)
        .send({
          holder_name: 'Auto Number Test',
          policy_type: 'health',
          coverage_amount: 30000,
          premium_amount: 1500,
          start_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(policyResponse.status).toBe(201);
      const createdPolicy = policyResponse.body.policy;
      expect(createdPolicy.policy_number).toBeDefined();
      expect(createdPolicy.policy_number).toMatch(/^POL\d{4}-\d{4}$/);

      // Create another policy to ensure uniqueness
      const secondPolicyResponse = await request(app)
        .post('/api/insurer/policies')
        .set('Authorization', `Bearer ${insurerToken}`)
        .send({
          holder_name: 'Auto Number Test 2',
          policy_type: 'property',
          coverage_amount: 50000,
          premium_amount: 2500,
          start_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(secondPolicyResponse.status).toBe(201);
      const secondPolicy = secondPolicyResponse.body.policy;
      expect(secondPolicy.policy_number).toBeDefined();
      expect(secondPolicy.policy_number).not.toBe(createdPolicy.policy_number);
    });

    test('should handle file upload workflow', async () => {
      // Upload document for policy
      const uploadResponse = await request(app)
        .post('/api/upload/document')
        .set('Authorization', `Bearer ${companyToken}`)
        .attach('file', Buffer.from('E2E test document content'), 'e2e-test-document.pdf')
        .field('description', 'E2E test document upload');

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.file.filename).toBe('e2e-test-document.pdf');

      // Upload image for claim
      const imageUploadResponse = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${insuredToken}`)
        .attach('file', Buffer.from('E2E test image content'), 'e2e-test-image.jpg')
        .field('description', 'E2E test image upload');

      expect(imageUploadResponse.status).toBe(200);
      expect(imageUploadResponse.body.success).toBe(true);
      expect(imageUploadResponse.body.file.filename).toBe('e2e-test-image.jpg');
    });

    test('should handle role-based access control throughout workflow', async () => {
      // Create a policy as company
      const policyResponse = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          policy_number: 'POL-RBAC-001',
          holder_name: 'RBAC Test User',
          holder_id_number: 'ID-RBAC-001',
          holder_phone: '1234567890',
          holder_email: 'rbac@example.com',
          policy_type: 'auto',
          coverage_amount: 20000,
          premium_amount: 1000,
          start_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(policyResponse.status).toBe(201);
      const createdPolicy = policyResponse.body.policy;

      // Officer should be able to read policy but not modify
      const officerPolicyRead = await request(app)
        .get(`/api/policies/${createdPolicy.id}`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(officerPolicyRead.status).toBe(200);

      // Officer should not be able to modify policy
      const officerPolicyModify = await request(app)
        .put(`/api/policies/${createdPolicy.id}`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ coverage_amount: 30000 });

      expect(officerPolicyModify.status).toBe(403);

      // Insured should be able to read policy
      const insuredPolicyRead = await request(app)
        .get(`/api/insured/policies/${createdPolicy.id}`)
        .set('Authorization', `Bearer ${insuredToken}`);

      expect(insuredPolicyRead.status).toBe(200);

      // Insured should not be able to modify policy
      const insuredPolicyModify = await request(app)
        .put(`/api/policies/${createdPolicy.id}`)
        .set('Authorization', `Bearer ${insuredToken}`)
        .send({ coverage_amount: 30000 });

      expect(insuredPolicyModify.status).toBe(403);

      // Admin should be able to do everything
      const adminPolicyRead = await request(app)
        .get(`/api/policies/${createdPolicy.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminPolicyRead.status).toBe(200);

      const adminPolicyModify = await request(app)
        .put(`/api/policies/${createdPolicy.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ coverage_amount: 30000 });

      expect(adminPolicyModify.status).toBe(200);
    });

    test('should handle error scenarios gracefully', async () => {
      // Test invalid policy creation
      const invalidPolicyResponse = await request(app)
        .post('/api/policies')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          policy_number: '', // Invalid: empty
          holder_name: '', // Invalid: empty
          policy_type: 'invalid_type', // Invalid: not in enum
          coverage_amount: -1000, // Invalid: negative
          premium_amount: 'not_a_number' // Invalid: not a number
        });

      expect(invalidPolicyResponse.status).toBe(400);
      expect(invalidPolicyResponse.body.success).toBe(false);
      expect(invalidPolicyResponse.body.errors).toBeDefined();

      // Test verification with non-existent policy
      const invalidVerificationResponse = await request(app)
        .post('/api/verifications/verify')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          policy_id: 99999, // Non-existent policy
          verification_type: 'document',
          verification_data: JSON.stringify({ verified: true }),
          location: 'Test Location',
          notes: 'Test verification'
        });

      expect(invalidVerificationResponse.status).toBe(400);
      expect(invalidVerificationResponse.body.success).toBe(false);

      // Test claim with non-existent policy
      const invalidClaimResponse = await request(app)
        .post('/api/insured/claims')
        .set('Authorization', `Bearer ${insuredToken}`)
        .send({
          policy_id: 99999, // Non-existent policy
          description: 'Test claim'
        });

      expect(invalidClaimResponse.status).toBe(400);
      expect(invalidClaimResponse.body.success).toBe(false);
    });
  });

  describe('Performance and Load Tests', () => {
    test('should handle multiple concurrent policy creations', async () => {
      const promises = [];
      const policyCount = 10;

      for (let i = 0; i < policyCount; i++) {
        promises.push(
          request(app)
            .post('/api/insurer/policies')
            .set('Authorization', `Bearer ${insurerToken}`)
            .send({
              holder_name: `Concurrent Test User ${i}`,
              policy_type: 'auto',
              coverage_amount: 10000 + (i * 1000),
              premium_amount: 500 + (i * 50),
              start_date: new Date().toISOString(),
              expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.policy.policy_number).toBeDefined();
      });

      // Verify all policies were created with unique numbers
      const policyNumbers = responses.map(r => r.body.policy.policy_number);
      const uniqueNumbers = new Set(policyNumbers);
      expect(uniqueNumbers.size).toBe(policyCount);
    });

    test('should handle dashboard data aggregation efficiently', async () => {
      // Create multiple policies and verifications
      const policies = [];
      for (let i = 0; i < 5; i++) {
        const policyResponse = await request(app)
          .post('/api/insurer/policies')
          .set('Authorization', `Bearer ${insurerToken}`)
          .send({
            holder_name: `Dashboard Test User ${i}`,
            policy_type: 'auto',
            coverage_amount: 10000,
            premium_amount: 500,
            start_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          });
        
        policies.push(policyResponse.body.policy);
      }

      // Create verifications for some policies
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/verifications/verify')
          .set('Authorization', `Bearer ${officerToken}`)
          .send({
            policy_id: policies[i].id,
            verification_type: 'document',
            verification_data: JSON.stringify({ verified: true }),
            location: 'Test Location',
            notes: 'Test verification'
          });
      }

      // Test dashboard performance
      const startTime = Date.now();
      const dashboardResponse = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      const endTime = Date.now();

      expect(dashboardResponse.status).toBe(200);
      expect(dashboardResponse.body.success).toBe(true);
      expect(dashboardResponse.body.dashboard).toBeDefined();
      
      // Dashboard should load within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
