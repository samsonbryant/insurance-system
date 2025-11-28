const { Company, User } = require('../models');

const DEFAULT_PASSWORD = 'Company123!'; // Default password for all companies

async function createCompanyUsers() {
  try {
    console.log('Starting company user creation...');
    
    // Get all approved companies
    const companies = await Company.findAll({
      where: {
        status: 'approved',
        is_active: true
      },
      order: [['name', 'ASC']]
    });

    if (companies.length === 0) {
      console.log('No approved companies found.');
      process.exit(0);
    }

    console.log(`Found ${companies.length} approved companies.\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const company of companies) {
      try {
        // Check if user already exists for this company
        const existingUser = await User.findOne({
          where: {
            email: company.contact_email,
            company_id: company.id
          }
        });

        if (existingUser) {
          // Update existing user if needed
          const needsUpdate = 
            existingUser.role !== 'insurer' ||
            !existingUser.is_active ||
            existingUser.company_id !== company.id;

          if (needsUpdate) {
            await existingUser.update({
              password_hash: DEFAULT_PASSWORD, // Will be hashed by model hook
              role: 'insurer',
              is_active: true,
              company_id: company.id
            });
            console.log(`✓ Updated: ${company.name} (${company.contact_email})`);
            console.log(`   Password reset to: ${DEFAULT_PASSWORD}`);
            updated++;
          } else {
            console.log(`⏭️  Skipped: ${company.name} (user already exists)`);
            skipped++;
          }
          continue;
        }

        // Create username from company name (sanitized)
        const username = company.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .substring(0, 50);

        // Check if username already exists
        let finalUsername = username;
        let counter = 1;
        while (await User.findOne({ where: { username: finalUsername } })) {
          finalUsername = `${username}_${counter}`;
          counter++;
        }

        // Create user account (password will be hashed by User model hook)
        const user = await User.create({
          username: finalUsername,
          email: company.contact_email,
          password_hash: DEFAULT_PASSWORD, // Will be automatically hashed by User model hook
          role: 'insurer',
          company_id: company.id,
          first_name: company.name.split(' ')[0] || 'Company',
          last_name: company.name.split(' ').slice(1).join(' ') || 'User',
          phone: company.contact_phone || null,
          is_active: true
        });

        console.log(`✅ Created: ${company.name}`);
        console.log(`   Username: ${finalUsername}`);
        console.log(`   Email: ${company.contact_email}`);
        console.log(`   Password: ${DEFAULT_PASSWORD}`);
        console.log('');
        created++;
      } catch (error) {
        console.error(`❌ Error creating user for ${company.name}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total Companies: ${companies.length}`);
    console.log(`\n🔑 Default Password for all companies: ${DEFAULT_PASSWORD}`);
    console.log('\n💡 Companies can now log in using their email address and the default password.');
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createCompanyUsers();
}

module.exports = { createCompanyUsers, DEFAULT_PASSWORD };

