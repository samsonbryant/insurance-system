const { Policy, Company } = require('../models');
const crypto = require('crypto');

async function createTestPolicies() {
  try {
    // Find an approved company or create a test one
    let company = await Company.findOne({ where: { status: 'approved' } });
    
    if (!company) {
      // Create a test company if none exists
      company = await Company.create({
        name: 'Test Insurance Company',
        license_number: 'LIC-TEST-001',
        registration_number: 'REG-TEST-001',
        contact_email: 'test@insurance.com',
        contact_phone: '0770000000',
        status: 'approved',
        is_active: true
      });
      console.log('Created test company:', company.name);
    }

    console.log('Using company:', company.name, '(ID:', company.id + ')');

    // Create test policies
    const testPolicies = [
      {
        policy_number: 'POL-2024-001',
        holder_name: 'John Doe',
        holder_id_number: 'ID123456',
        holder_phone: '0771111111',
        holder_email: 'john.doe@example.com',
        policy_type: 'auto',
        coverage_amount: 50000.00,
        premium_amount: 1200.00,
        start_date: '2024-01-01',
        expiry_date: '2025-12-31',
        status: 'active',
        is_active: true,
        approval_status: 'approved',
        company_id: company.id
      },
      {
        policy_number: 'POL-2024-002',
        holder_name: 'Jane Smith',
        holder_id_number: 'ID789012',
        holder_phone: '0772222222',
        holder_email: 'jane.smith@example.com',
        policy_type: 'health',
        coverage_amount: 100000.00,
        premium_amount: 2400.00,
        start_date: '2024-03-01',
        expiry_date: '2025-02-28',
        status: 'active',
        is_active: true,
        approval_status: 'approved',
        company_id: company.id
      },
      {
        policy_number: 'POL-2023-099',
        holder_name: 'Robert Johnson',
        holder_id_number: 'ID345678',
        holder_phone: '0773333333',
        policy_type: 'auto',
        coverage_amount: 30000.00,
        premium_amount: 900.00,
        start_date: '2023-06-01',
        expiry_date: '2024-05-31', // Expired policy
        status: 'expired',
        is_active: false,
        approval_status: 'approved',
        company_id: company.id
      }
    ];

    const createdPolicies = [];
    const errors = [];

    for (const policyData of testPolicies) {
      try {
        // Check if policy already exists
        const existing = await Policy.findOne({
          where: {
            policy_number: policyData.policy_number,
            company_id: company.id
          }
        });

        if (existing) {
          console.log(`Policy ${policyData.policy_number} already exists, skipping...`);
          continue;
        }

        // Generate hash
        const hashData = {
          policy_number: policyData.policy_number,
          holder_name: policyData.holder_name,
          expiry_date: policyData.expiry_date,
          company_id: company.id
        };
        const hash = crypto.createHash('sha256')
          .update(JSON.stringify(hashData))
          .digest('hex');

        const policy = await Policy.create({
          ...policyData,
          hash: hash
        });

        createdPolicies.push(policy);
        console.log(`✓ Created policy: ${policy.policy_number} - ${policy.holder_name}`);
      } catch (error) {
        errors.push({ policy: policyData.policy_number, error: error.message });
        console.error(`✗ Error creating policy ${policyData.policy_number}:`, error.message);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Created: ${createdPolicies.length} policies`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(e => console.log(`  - ${e.policy}: ${e.error}`));
    }

    console.log('\nTest policies ready for verification!');
    console.log('You can now test verification with:');
    createdPolicies.forEach(p => {
      console.log(`  - Policy: ${p.policy_number}, Holder: ${p.holder_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
createTestPolicies();

