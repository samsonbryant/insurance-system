const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken, requireInsurer } = require('../middleware/auth');
const { requirePermission, requireResourceAccess, validateUserRole, applyResourceFilters } = require('../middleware/rbac');
const { User, Company, Policy, Claim, Statement, Approval } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const rbacService = require('../services/rbacService');
const PolicyNumberService = require('../services/policyNumberService');
const sequelize = require('../config/database');
const { fn, col, Op } = require('sequelize');

const router = express.Router();

// Apply authentication and insurer role check to all routes
router.use(authenticateToken);
router.use(requireInsurer);
router.use(validateUserRole);

/**
 * @route GET /api/insurer/dashboard
 * @desc Get insurer dashboard statistics
 * @access Insurer only
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const companyId = req.user.company_id;
  
  const stats = await Promise.all([
    // Company policies
    Policy.count({ where: { company_id: companyId } }),
    Policy.count({ where: { company_id: companyId, approval_status: 'approved' } }),
    Policy.count({ where: { company_id: companyId, approval_status: 'pending' } }),
    Policy.count({ where: { company_id: companyId, approval_status: 'declined' } }),
    
    // Company claims
    Claim.count({ where: { insurer_id: companyId } }),
    Claim.count({ where: { insurer_id: companyId, status: 'reported' } }),
    Claim.count({ where: { insurer_id: companyId, status: 'settled' } }),
    Claim.count({ where: { insurer_id: companyId, status: 'denied' } }),
    
    
    // Company users
    User.count({ where: { company_id: companyId } }),
    
    // Recent policies (last 30 days)
    Policy.count({ 
      where: { 
        company_id: companyId,
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  const [
    totalPolicies,
    approvedPolicies,
    pendingPolicies,
    declinedPolicies,
    totalClaims,
    reportedClaims,
    settledClaims,
    deniedClaims,
    totalUsers,
    recentPolicies
  ] = stats;

  res.json({
    success: true,
    dashboard: {
      policies: {
        total: totalPolicies,
        approved: approvedPolicies,
        pending: pendingPolicies,
        declined: declinedPolicies,
        recent: recentPolicies
      },
      claims: {
        total: totalClaims,
        reported: reportedClaims,
        settled: settledClaims,
        denied: deniedClaims
      },
      users: {
        total: totalUsers
      }
    }
  });
}));

/**
 * @route GET /api/insurer/registration
 * @desc Get company registration details
 * @access Insurer only
 */
router.get('/registration', asyncHandler(async (req, res) => {
  const company = await Company.findByPk(req.user.company_id, {
    attributes: [
      'id', 'name', 'license_number', 'registration_number', 
      'cbl_registration_id', 'registration_status', 'registration_expiry',
      'contact_email', 'contact_phone', 'address', 'logo_url',
      'suspension_reason', 'suspension_duration'
    ]
  });

  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  res.json({
    success: true,
    registration: company
  });
}));

/**
 * @route PUT /api/insurer/registration/renew
 * @desc Renew company registration
 * @access Insurer only
 */
router.put('/registration/renew', [
  body('renewal_documents').optional().isArray(),
  body('notes').optional().isString()
], asyncHandler(async (req, res) => {
  const { renewal_documents, notes } = req.body;
  const companyId = req.user.company_id;

  const company = await Company.findByPk(companyId);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  // Check if company is eligible for renewal
  if (company.registration_status === 'suspended') {
    return res.status(400).json({
      success: false,
      error: 'Cannot renew suspended registration'
    });
  }

  // Create approval request for renewal
  const approval = await Approval.create({
    entity_type: 'insurer',
    entity_id: companyId,
    status: 'pending',
    reason: `Registration renewal request${notes ? ': ' + notes : ''}`
  });

  // Update company status to pending renewal
  await company.update({
    registration_status: 'pending'
  });

  res.json({
    success: true,
    message: 'Registration renewal request submitted',
    approval
  });
}));

/**
 * @route GET /api/insurer/policies
 * @desc Get company policies with filtering
 * @access Insurer only
 */
router.get('/policies', [
  query('status').optional().isIn(['active', 'expired', 'suspended']),
  query('approval_status').optional().isIn(['pending', 'approved', 'declined']),
  query('policy_type').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], applyResourceFilters('policies'), asyncHandler(async (req, res) => {
  const { status, approval_status, policy_type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = req.queryOptions.where || {};
  
  if (status) {
    where.status = status;
  }
  if (approval_status) {
    where.approval_status = approval_status;
  }
  if (policy_type) {
    where.policy_type = policy_type;
  }

  const policies = await Policy.findAndCountAll({
    where,
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'license_number']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    policies: policies.rows,
    pagination: {
      total: policies.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(policies.count / limit)
    }
  });
}));

/**
 * @route POST /api/insurer/policies
 * @desc Create new policy
 * @access Insurer only
 */
router.post('/policies', [
  body('holder_name').notEmpty().withMessage('Holder name is required'),
  body('policy_type').notEmpty().withMessage('Policy type is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
  body('policy_number').optional().isString(),
  body('insured_id').optional().isString(),
  body('holder_id_number').optional().isString(),
  body('holder_phone').optional().isString(),
  body('holder_email').optional().isEmail(),
  body('coverage_amount').optional().isDecimal(),
  body('premium_amount').optional().isDecimal()
], asyncHandler(async (req, res) => {
  const companyId = req.user.company_id;
  const { policy_number, policy_type, ...otherData } = req.body;

  // Generate policy number if not provided
  let finalPolicyNumber = policy_number;
  let policyNumberData = null;
  
  if (!finalPolicyNumber) {
    policyNumberData = await PolicyNumberService.generateUniquePolicyNumber(
      companyId, 
      policy_type
    );
    finalPolicyNumber = policyNumberData.policyNumber;
  }

  const policyData = {
    ...otherData,
    policy_number: finalPolicyNumber,
    policy_type: policy_type,
    company_id: companyId,
    status: 'active',
    is_active: true,
    approval_status: 'pending' // Requires CBL approval
  };

  // Add policy numbering data if generated
  if (policyNumberData) {
    policyData.policy_year = policyNumberData.year;
    policyData.policy_counter = policyNumberData.sequenceNumber;
  }

  // Generate hash for policy verification
  const crypto = require('crypto');
  const hashData = {
    policy_number: finalPolicyNumber,
    holder_name: policyData.holder_name,
    expiry_date: policyData.expiry_date,
    company_id: companyId
  };
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(hashData))
    .digest('hex');

  policyData.hash = hash;

  const policy = await Policy.create(policyData);

  // Create approval request for the policy
  await Approval.create({
    entity_type: 'policy',
    entity_id: policy.id,
    status: 'pending',
    reason: 'New policy requires CBL approval'
  });

  res.status(201).json({
    success: true,
    message: 'Policy created successfully',
    policy: {
      ...policy.toJSON(),
      generatedPolicyNumber: policyNumberData ? policyNumberData.policyNumber : null
    }
  });
}));

/**
 * @route GET /api/insurer/claims
 * @desc Get company claims
 * @access Insurer only
 */
router.get('/claims', [
  query('status').optional().isIn(['reported', 'settled', 'denied']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], applyResourceFilters('claims'), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = req.queryOptions.where || {};
  if (status) {
    where.status = status;
  }

  let claims;
  try {
    claims = await Claim.findAndCountAll({
      where,
      include: [
        {
          model: Policy,
          as: 'policy',
          attributes: ['id', 'policy_number', 'holder_name', 'policy_type'],
          required: false
        },
        {
          model: User,
          as: 'insured',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true
    });
  } catch (error) {
    console.error('Error fetching claims:', error);
    // Fallback: fetch without includes
    claims = await Claim.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
  }

  res.json({
    success: true,
    claims: claims.rows,
    pagination: {
      total: claims.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(claims.count / limit)
    }
  });
}));

/**
 * @route PUT /api/insurer/claims/:id/settle
 * @desc Settle a claim
 * @access Insurer only
 */
router.put('/claims/:id/settle', [
  param('id').isInt().withMessage('Valid claim ID required'),
  body('settlement_amount').optional().isDecimal(),
  body('settlement_notes').optional().isString()
], requireResourceAccess('claim'), asyncHandler(async (req, res) => {
  const { settlement_amount, settlement_notes } = req.body;
  const claim = req.resource;

  if (claim.status !== 'reported') {
    return res.status(400).json({
      success: false,
      error: 'Only reported claims can be settled'
    });
  }

  await claim.update({
    status: 'settled',
    reason: settlement_notes || 'Claim settled by insurer'
  });

  res.json({
    success: true,
    message: 'Claim settled successfully',
    claim
  });
}));

/**
 * @route PUT /api/insurer/claims/:id/deny
 * @desc Deny a claim
 * @access Insurer only
 */
router.put('/claims/:id/deny', [
  param('id').isInt().withMessage('Valid claim ID required'),
  body('denial_reason').notEmpty().withMessage('Denial reason is required')
], requireResourceAccess('claim'), asyncHandler(async (req, res) => {
  const { denial_reason } = req.body;
  const claim = req.resource;

  if (claim.status !== 'reported') {
    return res.status(400).json({
      success: false,
      error: 'Only reported claims can be denied'
    });
  }

  await claim.update({
    status: 'denied',
    reason: denial_reason
  });

  res.json({
    success: true,
    message: 'Claim denied successfully',
    claim
  });
}));

/**
 * @route GET /api/insurer/statements
 * @desc Get policy statements
 * @access Insurer only
 */
router.get('/statements', [
  query('policy_id').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { policy_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const companyId = req.user.company_id;

  const where = {};
  if (policy_id) {
    where.policy_id = policy_id;
  }

  const statements = await Statement.findAndCountAll({
    where,
    include: [
      {
        model: Policy,
        as: 'policy',
        where: { company_id: companyId },
        attributes: ['id', 'policy_number', 'holder_name', 'policy_type']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    statements: statements.rows,
    pagination: {
      total: statements.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(statements.count / limit)
    }
  });
}));

/**
 * @route POST /api/insurer/statements/generate
 * @desc Generate policy statement
 * @access Insurer only
 */
router.post('/statements/generate', [
  body('policy_id').isInt().withMessage('Policy ID is required'),
  body('statement_type').optional().isIn(['monthly', 'quarterly', 'annual', 'custom']),
  body('period_start').optional().isISO8601(),
  body('period_end').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const { policy_id, statement_type = 'monthly', period_start, period_end } = req.body;
  const companyId = req.user.company_id;

  // Verify policy belongs to company
  const policy = await Policy.findOne({
    where: {
      id: policy_id,
      company_id: companyId
    }
  });

  if (!policy) {
    return res.status(404).json({
      success: false,
      error: 'Policy not found or access denied'
    });
  }

  // Generate statement details
  const statementDetails = {
    policy_number: policy.policy_number,
    holder_name: policy.holder_name,
    policy_type: policy.policy_type,
    statement_type,
    generated_at: new Date().toISOString(),
    period_start: period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    period_end: period_end || new Date().toISOString(),
    coverage_amount: policy.coverage_amount,
    premium_amount: policy.premium_amount
  };

  const statement = await Statement.create({
    policy_id: policy.id,
    details_json: statementDetails
  });

  res.status(201).json({
    success: true,
    message: 'Statement generated successfully',
    statement
  });
}));


/**
 * @route GET /api/insurer/policy-numbers/next
 * @desc Get next available policy numbers for all types
 * @access Insurer only
 */
router.get('/policy-numbers/next', [
  query('year').optional().isInt({ min: 2000, max: 2030 })
], asyncHandler(async (req, res) => {
  const { year } = req.query;
  const companyId = req.user.company_id;

  try {
    const nextNumbers = await PolicyNumberService.getNextPolicyNumbers(companyId, year);
    
    res.json({
      success: true,
      nextNumbers
    });
  } catch (error) {
    console.error('Error getting next policy numbers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next policy numbers',
      message: error.message
    });
  }
}));

/**
 * @route GET /api/insurer/policy-numbers/stats
 * @desc Get policy numbering statistics
 * @access Insurer only
 */
router.get('/policy-numbers/stats', [
  query('year').optional().isInt({ min: 2000, max: 2030 })
], asyncHandler(async (req, res) => {
  const { year } = req.query;
  const companyId = req.user.company_id;

  try {
    const stats = await PolicyNumberService.getPolicyStats(companyId, year);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting policy stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get policy statistics',
      message: error.message
    });
  }
}));

/**
 * @route GET /api/insurer/reports/summary
 * @desc Get company reports summary
 * @access Insurer only
 */
router.get('/reports/summary', asyncHandler(async (req, res) => {
  const companyId = req.user.company_id;
  const isSQLite = sequelize.getDialect() === 'sqlite';
  const monthFn = isSQLite
    ? fn('strftime', '%Y-%m-01', col('created_at'))
    : fn('DATE_TRUNC', 'month', col('created_at'));

  const summary = await Promise.all([
    // Policy summary by type
    Policy.findAll({
      where: { company_id: companyId },
      attributes: [
        'policy_type',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('coverage_amount')), 'total_coverage'],
        [fn('SUM', col('premium_amount')), 'total_premium']
      ],
      group: ['policy_type']
    }),

    // Claims summary by status
    Claim.findAll({
      where: { insurer_id: companyId },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    }),

    // Monthly policy creation trend (last 12 months)
    Policy.findAll({
      where: {
        company_id: companyId,
        created_at: {
          [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
        }
      },
      attributes: [
        [monthFn, 'month'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [monthFn],
      order: [[monthFn, 'ASC']]
    })
  ]);

  const [policySummary, claimsSummary, monthlyTrend] = summary;

  res.json({
    success: true,
    summary: {
      policies: policySummary,
      claims: claimsSummary,
      monthly_trend: monthlyTrend
    }
  });
}));

module.exports = router;
