const cron = require('node-cron');
const axios = require('axios');
const { Company, Policy, AuditLog } = require('../models');
const { Op } = require('sequelize');

class DataSyncService {
  constructor() {
    this.syncJobs = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      console.log('Data sync service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting data sync service...');

    // Schedule sync jobs for all companies
    await this.scheduleAllSyncJobs();

    // Schedule cleanup job (daily at 2 AM)
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupExpiredPolicies();
    });

    console.log('Data sync service started successfully');
  }

  async scheduleAllSyncJobs() {
    try {
      const companies = await Company.findAll({
        where: {
          status: 'approved',
          is_active: true,
          sync_frequency: {
            [Op.ne]: 'manual'
          }
        }
      });

      for (const company of companies) {
        await this.scheduleCompanySync(company);
      }
    } catch (error) {
      console.error('Error scheduling sync jobs:', error);
    }
  }

  async scheduleCompanySync(company) {
    try {
      // Cancel existing job if any
      if (this.syncJobs.has(company.id)) {
        this.syncJobs.get(company.id).destroy();
      }

      let cronExpression;
      switch (company.sync_frequency) {
        case 'realtime':
          // Every 5 minutes for "realtime"
          cronExpression = '*/5 * * * *';
          break;
        case 'hourly':
          cronExpression = '0 * * * *';
          break;
        case 'daily':
          cronExpression = '0 6 * * *'; // 6 AM daily
          break;
        case 'weekly':
          cronExpression = '0 6 * * 1'; // Monday 6 AM
          break;
        default:
          return; // Skip manual sync
      }

      const job = cron.schedule(cronExpression, async () => {
        await this.syncCompanyData(company);
      }, {
        scheduled: true,
        timezone: 'Africa/Monrovia'
      });

      this.syncJobs.set(company.id, job);
      console.log(`Scheduled sync job for company ${company.name} (${company.sync_frequency})`);
    } catch (error) {
      console.error(`Error scheduling sync for company ${company.id}:`, error);
    }
  }

  async syncCompanyData(company) {
    const startTime = Date.now();
    let syncResult = {
      success: false,
      policies_created: 0,
      policies_updated: 0,
      errors: []
    };

    try {
      console.log(`Starting sync for company: ${company.name}`);

      if (!company.api_endpoint || !company.api_key) {
        throw new Error('API endpoint or API key not configured');
      }

      // Fetch data from company API
      const response = await axios.get(company.api_endpoint, {
        headers: {
          'Authorization': `Bearer ${company.api_key}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }

      const policies = response.data.policies || response.data || [];
      
      if (!Array.isArray(policies)) {
        throw new Error('Invalid response format: expected array of policies');
      }

      // Process each policy
      for (const policyData of policies) {
        try {
          await this.processPolicyData(company.id, policyData, syncResult);
        } catch (error) {
          syncResult.errors.push({
            policy_number: policyData.policy_number || 'unknown',
            error: error.message
          });
        }
      }

      syncResult.success = true;

      // Update company sync status
      await company.update({
        last_sync: new Date(),
        sync_status: 'success',
        sync_error: null
      });

      console.log(`Sync completed for ${company.name}: ${syncResult.policies_created} created, ${syncResult.policies_updated} updated`);

    } catch (error) {
      console.error(`Sync failed for company ${company.name}:`, error.message);
      
      syncResult.errors.push({
        error: error.message
      });

      // Update company sync status
      await company.update({
        last_sync: new Date(),
        sync_status: 'failed',
        sync_error: error.message
      });
    }

    // Log sync activity
    await AuditLog.create({
      action: 'DATA_SYNC',
      entity_type: 'COMPANY',
      entity_id: company.id,
      details: {
        company_name: company.name,
        sync_frequency: company.sync_frequency,
        duration_ms: Date.now() - startTime,
        result: syncResult
      },
      severity: syncResult.success ? 'low' : 'high',
      status: syncResult.success ? 'success' : 'failed',
      error_message: syncResult.errors.length > 0 ? JSON.stringify(syncResult.errors) : null
    });
  }

  async processPolicyData(companyId, policyData, syncResult) {
    const requiredFields = ['policy_number', 'holder_name', 'start_date', 'expiry_date'];
    
    for (const field of requiredFields) {
      if (!policyData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check if policy already exists
    const existingPolicy = await Policy.findOne({
      where: {
        policy_number: policyData.policy_number,
        company_id: companyId
      }
    });

    if (existingPolicy) {
      // Update existing policy
      await existingPolicy.update({
        holder_name: policyData.holder_name,
        holder_id_number: policyData.holder_id_number || existingPolicy.holder_id_number,
        holder_phone: policyData.holder_phone || existingPolicy.holder_phone,
        holder_email: policyData.holder_email || existingPolicy.holder_email,
        policy_type: policyData.policy_type || existingPolicy.policy_type,
        coverage_amount: policyData.coverage_amount || existingPolicy.coverage_amount,
        premium_amount: policyData.premium_amount || existingPolicy.premium_amount,
        start_date: policyData.start_date,
        expiry_date: policyData.expiry_date,
        details_json: policyData.details_json || existingPolicy.details_json,
        vehicle_info: policyData.vehicle_info || existingPolicy.vehicle_info,
        additional_beneficiaries: policyData.additional_beneficiaries || existingPolicy.additional_beneficiaries,
        last_synced: new Date()
      });
      syncResult.policies_updated++;
    } else {
      // Create new policy
      await Policy.create({
        policy_number: policyData.policy_number,
        holder_name: policyData.holder_name,
        holder_id_number: policyData.holder_id_number,
        holder_phone: policyData.holder_phone,
        holder_email: policyData.holder_email,
        policy_type: policyData.policy_type || 'auto',
        coverage_amount: policyData.coverage_amount,
        premium_amount: policyData.premium_amount,
        start_date: policyData.start_date,
        expiry_date: policyData.expiry_date,
        details_json: policyData.details_json,
        vehicle_info: policyData.vehicle_info,
        additional_beneficiaries: policyData.additional_beneficiaries,
        company_id: companyId,
        last_synced: new Date()
      });
      syncResult.policies_created++;
    }
  }

  async cleanupExpiredPolicies() {
    try {
      const today = new Date();
      const expiredPolicies = await Policy.update(
        { status: 'expired' },
        {
          where: {
            status: 'active',
            expiry_date: {
              [Op.lt]: today
            }
          }
        }
      );

      console.log(`Marked ${expiredPolicies[0]} policies as expired`);

      await AuditLog.create({
        action: 'CLEANUP_EXPIRED_POLICIES',
        entity_type: 'POLICY',
        details: {
          expired_count: expiredPolicies[0]
        },
        severity: 'low',
        status: 'success'
      });
    } catch (error) {
      console.error('Error cleaning up expired policies:', error);
    }
  }

  async triggerManualSync(companyId) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      if (company.status !== 'approved' || !company.is_active) {
        throw new Error('Company is not approved or active');
      }

      await this.syncCompanyData(company);
      return { success: true, message: 'Manual sync completed' };
    } catch (error) {
      console.error('Manual sync failed:', error);
      return { success: false, message: error.message };
    }
  }

  async rescheduleCompanySync(companyId) {
    try {
      const company = await Company.findByPk(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      await this.scheduleCompanySync(company);
      return { success: true, message: 'Sync job rescheduled' };
    } catch (error) {
      console.error('Error rescheduling sync:', error);
      return { success: false, message: error.message };
    }
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Stop all scheduled jobs
    for (const [companyId, job] of this.syncJobs) {
      job.destroy();
    }
    
    this.syncJobs.clear();
    console.log('Data sync service stopped');
  }
}

// Create singleton instance
const dataSyncService = new DataSyncService();

// Start the service
function startDataSync() {
  dataSyncService.start();
}

module.exports = {
  dataSyncService,
  startDataSync
};
