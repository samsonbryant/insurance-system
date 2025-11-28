const { Company, User } = require('../models');

const companies = [
  { name: 'Atlantic Life & General Insurance Company', license: 'ATL-001-2024', email: 'info@atlanticlife.lr', phone: '+231-456-789-0001' },
  { name: 'Secure Risk Insurance Company', license: 'SEC-002-2024', email: 'info@securerisk.lr', phone: '+231-456-789-0002' },
  { name: 'Accident & Casualty Insurance Company (ACICO)', license: 'ACI-003-2024', email: 'info@acico.lr', phone: '+231-456-789-0003' },
  { name: 'Mutual Benefits Assurance Company', license: 'MUT-004-2024', email: 'info@mutualbenefits.lr', phone: '+231-456-789-0004' },
  { name: 'American Underwriters Group', license: 'AMU-005-2024', email: 'info@americanunderwriters.lr', phone: '+231-456-789-0005' },
  { name: 'Saar Insurance Liberia', license: 'SAA-006-2024', email: 'info@saarinsurance.lr', phone: '+231-456-789-0006' },
  { name: 'Activa International Insurance', license: 'ACT-007-2024', email: 'info@activa.lr', phone: '+231-456-789-0007' },
  { name: 'Equity Insurance', license: 'EQU-008-2024', email: 'info@equityinsurance.lr', phone: '+231-456-789-0008' },
  { name: 'Blue Cross Insurance', license: 'BLU-009-2024', email: 'info@bluecross.lr', phone: '+231-456-789-0009' },
  { name: 'Insurance Company of Africa', license: 'ICA-010-2024', email: 'info@ica.lr', phone: '+231-456-789-0010' },
  { name: 'Omega Insurance Company', license: 'OME-011-2024', email: 'info@omegainurance.lr', phone: '+231-456-789-0011' },
  { name: 'Medicare Insurance Company', license: 'MED-012-2024', email: 'info@medicare.lr', phone: '+231-456-789-0012' },
  { name: 'Palm Insurance Company', license: 'PAL-013-2024', email: 'info@palminsurance.lr', phone: '+231-456-789-0013' }
];

async function registerCompanies() {
  try {
    console.log('Starting company registration...');
    
    // Get admin user for approval
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      throw new Error('Admin user not found. Please ensure admin user exists.');
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const companyData of companies) {
      try {
        // Check if company already exists
        const existing = await Company.findOne({
          where: {
            [require('sequelize').Op.or]: [
              { license_number: companyData.license },
              { contact_email: companyData.email }
            ]
          }
        });

        if (existing) {
          console.log(`⏭️  Skipped: ${companyData.name} (already exists)`);
          skipped++;
          continue;
        }

        // Create company
        const company = await Company.create({
          name: companyData.name,
          license_number: companyData.license,
          registration_number: `REG-${companyData.license}`,
          contact_email: companyData.email,
          contact_phone: companyData.phone,
          address: 'Monrovia, Liberia',
          status: 'approved',
          admin_approved_by: admin.id,
          sync_frequency: 'daily',
          is_active: true
        });

        console.log(`✅ Created: ${companyData.name} (ID: ${company.id})`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating ${companyData.name}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Registration Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${companies.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  registerCompanies();
}

module.exports = { registerCompanies };

