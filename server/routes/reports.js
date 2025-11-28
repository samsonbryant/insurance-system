const express = require('express');
const { query, validationResult } = require('express-validator');
const { Verification, Policy, Company, User, AuditLog } = require('../models');
const { requireAdmin, requireCompanyOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

// Get verification reports
router.get('/verifications', [
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('company_id').optional().isInt(),
  query('officer_id').optional().isInt(),
  query('status').optional().isIn(['valid', 'fake', 'pending', 'expired', 'not_found']),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { date_from, date_to, company_id, officer_id, status, format = 'json' } = req.query;

  const whereClause = {};

  // Company users can only see their own company reports
  if (req.userRole === 'company') {
    whereClause.company_id = req.companyId;
  } else if (company_id) {
    whereClause.company_id = company_id;
  }

  if (officer_id) whereClause.officer_id = officer_id;
  if (status) whereClause.status = status;

  if (date_from || date_to) {
    whereClause.created_at = {};
    if (date_from) whereClause.created_at[Op.gte] = date_from;
    if (date_to) whereClause.created_at[Op.lte] = date_to;
  }

  const verifications = await Verification.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'officer', attributes: ['id', 'username', 'first_name', 'last_name'] },
      { model: Company, as: 'company', attributes: ['id', 'name', 'license_number'] },
      { model: Policy, as: 'policy', attributes: ['id', 'policy_number', 'holder_name', 'expiry_date'] }
    ],
    order: [['created_at', 'DESC']]
  });

  // Generate summary statistics
  const stats = {
    total_verifications: verifications.length,
    valid_count: verifications.filter(v => v.status === 'valid').length,
    fake_count: verifications.filter(v => v.status === 'fake').length,
    expired_count: verifications.filter(v => v.status === 'expired').length,
    not_found_count: verifications.filter(v => v.status === 'not_found').length,
    pending_count: verifications.filter(v => v.status === 'pending').length,
    fake_detection_rate: verifications.length > 0 ? 
      (verifications.filter(v => v.status === 'fake').length / verifications.length * 100).toFixed(2) : 0
  };

  if (format === 'csv') {
    const csvData = generateVerificationCSV(verifications);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="verification_report.csv"');
    return res.send(csvData);
  }

  res.json({
    report: {
      generated_at: new Date().toISOString(),
      filters: { date_from, date_to, company_id, officer_id, status },
      statistics: stats,
      verifications
    }
  });
}));

// Get policy reports
router.get('/policies', [
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('company_id').optional().isInt(),
  query('policy_type').optional().isIn(['auto', 'health', 'life', 'property', 'business', 'other']),
  query('status').optional().isIn(['active', 'expired', 'cancelled', 'suspended']),
  query('format').optional().isIn(['json', 'csv'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { date_from, date_to, company_id, policy_type, status, format = 'json' } = req.query;

  const whereClause = {};

  // Company users can only see their own company policies
  if (req.userRole === 'company') {
    whereClause.company_id = req.companyId;
  } else if (company_id) {
    whereClause.company_id = company_id;
  }

  if (policy_type) whereClause.policy_type = policy_type;
  if (status) whereClause.status = status;

  if (date_from || date_to) {
    whereClause.created_at = {};
    if (date_from) whereClause.created_at[Op.gte] = date_from;
    if (date_to) whereClause.created_at[Op.lte] = date_to;
  }

  const policies = await Policy.findAll({
    where: whereClause,
    include: [
      { model: Company, as: 'company', attributes: ['id', 'name', 'license_number'] }
    ],
    order: [['created_at', 'DESC']]
  });

  // Generate summary statistics
  const stats = {
    total_policies: policies.length,
    active_count: policies.filter(p => p.status === 'active').length,
    expired_count: policies.filter(p => p.status === 'expired').length,
    cancelled_count: policies.filter(p => p.status === 'cancelled').length,
    suspended_count: policies.filter(p => p.status === 'suspended').length,
    policy_type_breakdown: policies.reduce((acc, policy) => {
      acc[policy.policy_type] = (acc[policy.policy_type] || 0) + 1;
      return acc;
    }, {})
  };

  if (format === 'csv') {
    const csvData = generatePolicyCSV(policies);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="policy_report.csv"');
    return res.send(csvData);
  }

  res.json({
    report: {
      generated_at: new Date().toISOString(),
      filters: { date_from, date_to, company_id, policy_type, status },
      statistics: stats,
      policies
    }
  });
}));

// Get dashboard statistics
router.get('/dashboard', asyncHandler(async (req, res) => {
  const whereClause = {};
  
  // Company users see only their company data
  if (req.userRole === 'company') {
    whereClause.company_id = req.companyId;
  }

  // Build promises array
  const promises = [
    Verification.count({ where: whereClause }),
    Policy.count({ where: whereClause }),
    Verification.count({
      where: {
        ...whereClause,
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    Policy.count({
      where: {
        ...whereClause,
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    Verification.count({
      where: {
        ...whereClause,
        status: 'fake',
        created_at: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    }),
    Verification.findAll({
      attributes: [
        'status',
        [Verification.sequelize.fn('COUNT', Verification.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status']
    }),
    Policy.findAll({
      attributes: [
        'policy_type',
        [Policy.sequelize.fn('COUNT', Policy.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['policy_type']
    })
  ];

  // Add admin-only stats
  if (req.userRole === 'admin') {
    promises.push(
      User.count(),
      User.count({ where: { is_active: true } }),
      Company.count(),
      Company.count({ where: { status: 'approved' } })
    );
  }

  const results = await Promise.all(promises);

  let resultIndex = 0;
  const totalVerifications = results[resultIndex++];
  const totalPolicies = results[resultIndex++];
  const recentVerifications = results[resultIndex++];
  const recentPolicies = results[resultIndex++];
  const fakeDetections = results[resultIndex++];
  const verificationStats = results[resultIndex++];
  const policyStats = results[resultIndex++];

  const dashboardStats = {
    overview: {
      total_verifications: totalVerifications,
      total_policies: totalPolicies,
      recent_verifications_24h: recentVerifications,
      recent_policies_24h: recentPolicies,
      fake_detections_7d: fakeDetections
    },
    verification_breakdown: verificationStats.reduce((acc, item) => {
      acc[item.status] = parseInt(item.dataValues.count);
      return acc;
    }, {}),
    policy_breakdown: policyStats.reduce((acc, item) => {
      acc[item.policy_type] = parseInt(item.dataValues.count);
      return acc;
    }, {})
  };

  // Add admin-specific stats
  if (req.userRole === 'admin') {
    dashboardStats.users = {
      total: results[resultIndex++],
      active: results[resultIndex++]
    };
    dashboardStats.companies = {
      total: results[resultIndex++],
      approved: results[resultIndex++]
    };
  }

  res.json({ dashboardStats });
}));

// Get audit logs (Admin only)
router.get('/audit', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('user_id').optional().isInt(),
  query('action').optional().isLength({ min: 1 }),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const { user_id, action, severity, date_from, date_to } = req.query;

  const whereClause = {};
  if (user_id) whereClause.user_id = user_id;
  if (action) whereClause.action = { [Op.like]: `%${action}%` };
  if (severity) whereClause.severity = severity;

  if (date_from || date_to) {
    whereClause.created_at = {};
    if (date_from) whereClause.created_at[Op.gte] = date_from;
    if (date_to) whereClause.created_at[Op.lte] = date_to;
  }

  const { count, rows: auditLogs } = await AuditLog.findAndCountAll({
    where: whereClause,
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'first_name', 'last_name'] }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  res.json({
    audit_logs: auditLogs,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Helper function to generate CSV data
function generateVerificationCSV(verifications) {
  const headers = [
    'ID', 'Policy Number', 'Holder Name', 'Officer', 'Company', 'Status', 
    'Reason', 'Location', 'Confidence Score', 'Verified At', 'Response Time (ms)'
  ];
  
  const rows = verifications.map(v => [
    v.id,
    v.policy_number,
    v.holder_name,
    v.officer ? `${v.officer.first_name} ${v.officer.last_name}` : '',
    v.company ? v.company.name : '',
    v.status,
    v.reason || '',
    v.location || '',
    v.confidence_score || '',
    v.verified_at || '',
    v.response_time_ms || ''
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generatePolicyCSV(policies) {
  const headers = [
    'ID', 'Policy Number', 'Holder Name', 'Policy Type', 'Status', 
    'Start Date', 'Expiry Date', 'Company', 'Coverage Amount', 'Premium Amount'
  ];
  
  const rows = policies.map(p => [
    p.id,
    p.policy_number,
    p.holder_name,
    p.policy_type,
    p.status,
    p.start_date,
    p.expiry_date,
    p.company ? p.company.name : '',
    p.coverage_amount || '',
    p.premium_amount || ''
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

module.exports = router;
