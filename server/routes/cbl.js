const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken, requireCBL } = require('../middleware/auth');
const { requirePermission, requireResourceAccess, validateUserRole } = require('../middleware/rbac');
const { User, Company, Policy, Claim, Approval, ReferenceCheck } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const rbacService = require('../services/rbacService');

const router = express.Router();

const hasRegistrationStatus = !!Company.rawAttributes?.registration_status;
const statusField = hasRegistrationStatus ? 'registration_status' : 'status';
const statusFilter = (value) => ({ [statusField]: value });
const buildStatusUpdate = (value) =>
  hasRegistrationStatus
    ? { registration_status: value, status: value }
    : { status: value };

// Apply authentication and CBL role check to all routes
router.use(authenticateToken);
router.use(requireCBL);
router.use(validateUserRole);

/**
 * @route GET /api/cbl/dashboard
 * @desc Get CBL dashboard statistics
 * @access CBL only
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    // Total companies
    Company.count(),
    
    // Companies by status
    Company.count({ where: statusFilter('approved') }),
    Company.count({ where: statusFilter('pending') }),
    Company.count({ where: statusFilter('suspended') }),
    
    // Total policies
    Policy.count(),
    
    // Policies by approval status
    Policy.count({ where: { approval_status: 'approved' } }),
    Policy.count({ where: { approval_status: 'pending' } }),
    Policy.count({ where: { approval_status: 'declined' } }),
    
    // Total claims
    Claim.count(),
    
    // Claims by status
    Claim.count({ where: { status: 'reported' } }),
    Claim.count({ where: { status: 'settled' } }),
    Claim.count({ where: { status: 'denied' } }),
    
    // Pending approvals
    Approval.count({ where: { status: 'pending' } })
  ]);

  const [
    totalCompanies,
    approvedCompanies,
    pendingCompanies,
    suspendedCompanies,
    totalPolicies,
    approvedPolicies,
    pendingPolicies,
    declinedPolicies,
    totalClaims,
    reportedClaims,
    settledClaims,
    deniedClaims,
    pendingApprovals
  ] = stats;

  res.json({
    success: true,
    dashboard: {
      companies: {
        total: totalCompanies,
        approved: approvedCompanies,
        pending: pendingCompanies,
        suspended: suspendedCompanies
      },
      policies: {
        total: totalPolicies,
        approved: approvedPolicies,
        pending: pendingPolicies,
        declined: declinedPolicies
      },
      claims: {
        total: totalClaims,
        reported: reportedClaims,
        settled: settledClaims,
        denied: deniedClaims
      },
      approvals: {
        pending: pendingApprovals
      },
    }
  });
}));

/**
 * @route GET /api/cbl/companies
 * @desc Get all companies with CBL registration details
 * @access CBL only
 */
router.get('/companies', [
  query('status').optional().isIn(['pending', 'approved', 'suspended', 'expired']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) {
    where[statusField] = status;
  }

  const companies = await Company.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'users',
        attributes: ['id', 'username', 'first_name', 'last_name', 'role', 'is_active']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    companies: companies.rows,
    pagination: {
      total: companies.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(companies.count / limit)
    }
  });
}));

/**
 * @route POST /api/cbl/companies/import
 * @desc Import companies via CSV/JSON bulk upload
 * @access CBL only
 */
router.post('/companies/import', [
  body('companies').isArray().withMessage('Companies array is required'),
  body('companies.*.name').notEmpty().withMessage('Company name is required'),
  body('companies.*.license_number').notEmpty().withMessage('License number is required'),
  body('companies.*.registration_number').notEmpty().withMessage('Registration number is required'),
  body('companies.*.contact_email').isEmail().withMessage('Valid email is required'),
  body('companies.*.contact_phone').notEmpty().withMessage('Contact phone is required')
], asyncHandler(async (req, res) => {
  const { companies } = req.body;
  const importedCompanies = [];
  const errors = [];

  for (const companyData of companies) {
    try {
      // Check if company already exists
      const existingCompany = await Company.findOne({
        where: {
          license_number: companyData.license_number
        }
      });

      if (existingCompany) {
        errors.push({
          company: companyData.name,
          error: 'Company with this license number already exists'
        });
        continue;
      }

      const company = await Company.create({
        ...companyData,
        ...buildStatusUpdate('pending'),
        is_active: true
      });

      importedCompanies.push(company);
    } catch (error) {
      errors.push({
        company: companyData.name,
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    imported: importedCompanies.length,
    errors,
    companies: importedCompanies
  });
}));

/**
 * @route PUT /api/cbl/companies/:id/approve
 * @desc Approve company registration
 * @access CBL only
 */
router.put('/companies/:id/approve', [
  param('id').isInt().withMessage('Valid company ID required'),
  body('approval_notes').optional().isString()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approval_notes } = req.body;

  const company = await Company.findByPk(id);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  // Update company status
  await company.update({
    ...buildStatusUpdate('approved'),
    admin_approved_by: req.user.id,
    registration_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  });

  // Create approval record
  await Approval.create({
    entity_type: 'insurer',
    entity_id: company.id,
    status: 'approved',
    approver_id: req.user.id,
    reason: approval_notes || 'Company registration approved by CBL'
  });

  res.json({
    success: true,
    message: 'Company approved successfully',
    company
  });
}));

/**
 * @route PUT /api/cbl/companies/:id/suspend
 * @desc Suspend company registration
 * @access CBL only
 */
router.put('/companies/:id/suspend', [
  param('id').isInt().withMessage('Valid company ID required'),
  body('reason').notEmpty().withMessage('Suspension reason is required'),
  body('duration').isInt({ min: 1 }).withMessage('Valid suspension duration required')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, duration } = req.body;

  const company = await Company.findByPk(id);
  if (!company) {
    return res.status(404).json({
      success: false,
      error: 'Company not found'
    });
  }

  // Update company status
  await company.update({
    ...buildStatusUpdate('suspended'),
    suspension_reason: reason,
    suspension_duration: duration,
    admin_approved_by: req.user.id
  });

  // Create approval record
  await Approval.create({
    entity_type: 'insurer',
    entity_id: company.id,
    status: 'declined',
    approver_id: req.user.id,
    reason: `Company suspended: ${reason}`
  });

  res.json({
    success: true,
    message: 'Company suspended successfully',
    company
  });
}));

/**
 * @route GET /api/cbl/approvals
 * @desc Get all pending approvals
 * @access CBL only
 */
router.get('/approvals', [
  query('status').optional().isIn(['pending', 'approved', 'declined']),
  query('entity_type').optional().isIn(['insurer', 'policy', 'user', 'bond', 'type']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { status = 'pending', entity_type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = { status };
  if (entity_type) {
    where.entity_type = entity_type;
  }

  let approvals;
  
  try {
    approvals = await Approval.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true // Important for count with includes
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    // Fallback: fetch without includes if there's an association error
    approvals = await Approval.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
  }

  res.json({
    success: true,
    approvals: approvals.rows,
    pagination: {
      total: approvals.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(approvals.count / limit)
    }
  });
}));

/**
 * @route PUT /api/cbl/approvals/:id/approve
 * @desc Approve a pending approval
 * @access CBL only
 */
router.put('/approvals/:id/approve', [
  param('id').isInt().withMessage('Valid approval ID required'),
  body('notes').optional().isString()
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const approval = await Approval.findByPk(id);
  if (!approval) {
    return res.status(404).json({
      success: false,
      error: 'Approval not found'
    });
  }

  if (approval.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: 'Approval is not pending'
    });
  }

  // Update approval status
  await approval.update({
    status: 'approved',
    approver_id: req.user.id,
    reason: notes || 'Approved by CBL'
  });

  // Update related entity based on type
  switch (approval.entity_type) {
    case 'insurer':
      await Company.update(
        buildStatusUpdate('approved'),
        { where: { id: approval.entity_id } }
      );
      break;
    case 'policy':
      await Policy.update(
        { 
          approval_status: 'approved',
          approval_date: new Date(),
          approver_id: req.user.id
        },
        { where: { id: approval.entity_id } }
      );
      break;
    // Add other entity types as needed
  }

  res.json({
    success: true,
    message: 'Approval processed successfully',
    approval
  });
}));

/**
 * @route PUT /api/cbl/approvals/:id/decline
 * @desc Decline a pending approval
 * @access CBL only
 */
router.put('/approvals/:id/decline', [
  param('id').isInt().withMessage('Valid approval ID required'),
  body('reason').notEmpty().withMessage('Decline reason is required')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const approval = await Approval.findByPk(id);
  if (!approval) {
    return res.status(404).json({
      success: false,
      error: 'Approval not found'
    });
  }

  if (approval.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: 'Approval is not pending'
    });
  }

  // Update approval status
  await approval.update({
    status: 'declined',
    approver_id: req.user.id,
    reason
  });

  // Update related entity based on type
  switch (approval.entity_type) {
    case 'insurer':
      await Company.update(
        buildStatusUpdate('declined'),
        { where: { id: approval.entity_id } }
      );
      break;
    case 'policy':
      await Policy.update(
        { 
          approval_status: 'declined',
          approver_id: req.user.id
        },
        { where: { id: approval.entity_id } }
      );
      break;
    // Add other entity types as needed
  }

  res.json({
    success: true,
    message: 'Approval declined successfully',
    approval
  });
}));


/**
 * @route POST /api/cbl/reference-check
 * @desc Perform reference check across all companies
 * @access CBL only
 */
router.post('/reference-check', [
  body('search_query').notEmpty().withMessage('Search query is required'),
  body('search_type').optional().isIn(['name', 'policy_number', 'id_number'])
], asyncHandler(async (req, res) => {
  const { search_query, search_type = 'name' } = req.body;

  const results = {
    policies: [],
    users: [],
    companies: []
  };

  try {
    // Search policies
    const policies = await Policy.findAll({
      where: {
        [search_type === 'name' ? 'holder_name' : 
         search_type === 'policy_number' ? 'policy_number' : 
         'holder_id_number']: {
          [require('sequelize').Op.like]: `%${search_query}%`
        }
      },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'license_number']
        }
      ],
      limit: 50
    });

    results.policies = policies;

    // Search users
    const users = await User.findAll({
      where: {
        [search_type === 'name' ? 'first_name' : 
         search_type === 'policy_number' ? 'policy_numbers' : 
         'insured_id']: {
          [require('sequelize').Op.like]: `%${search_query}%`
        }
      },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'license_number']
        }
      ],
      limit: 50
    });

    results.users = users;

    // Create reference check record
    await ReferenceCheck.create({
      search_query,
      results_json: results
    });

    res.json({
      success: true,
      results,
      total_found: policies.length + users.length
    });
  } catch (error) {
    console.error('Reference check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform reference check'
    });
  }
}));

/**
 * @route GET /api/cbl/reference-history
 * @desc Get reference check history
 * @access CBL only
 */
router.get('/reference-history', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const checks = await ReferenceCheck.findAndCountAll({
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    checks: checks.rows,
    pagination: {
      total: checks.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(checks.count / limit)
    }
  });
}));

module.exports = router;
