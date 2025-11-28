const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken, requireInsured } = require('../middleware/auth');
const { requirePermission, requireResourceAccess, validateUserRole, applyResourceFilters } = require('../middleware/rbac');
const { User, Company, Policy, Claim, Statement, Verification } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const rbacService = require('../services/rbacService');

const router = express.Router();

// Apply authentication and insured role check to all routes
router.use(authenticateToken);
router.use(requireInsured);
router.use(validateUserRole);

/**
 * @route GET /api/insured/dashboard
 * @desc Get insured dashboard statistics
 * @access Insured only
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const insuredId = req.user.insured_id;

  const stats = await Promise.all([
    // User's policies
    Policy.count({ where: { insured_id: insuredId } }),
    Policy.count({ where: { insured_id: insuredId, status: 'active' } }),
    Policy.count({ where: { insured_id: insuredId, status: 'expired' } }),
    
    // User's claims
    Claim.count({ where: { insured_id: userId } }),
    Claim.count({ where: { insured_id: userId, status: 'reported' } }),
    Claim.count({ where: { insured_id: userId, status: 'settled' } }),
    Claim.count({ where: { insured_id: userId, status: 'denied' } }),
    
    // Policy verifications
    Verification.count({ 
      where: { 
        holder_name: {
          [require('sequelize').Op.like]: `%${req.user.first_name}%`
        }
      }
    })
  ]);

  const [
    totalPolicies,
    activePolicies,
    expiredPolicies,
    totalClaims,
    reportedClaims,
    settledClaims,
    deniedClaims,
    totalVerifications
  ] = stats;

  res.json({
    success: true,
    dashboard: {
      policies: {
        total: totalPolicies,
        active: activePolicies,
        expired: expiredPolicies
      },
      claims: {
        total: totalClaims,
        reported: reportedClaims,
        settled: settledClaims,
        denied: deniedClaims
      },
      verifications: {
        total: totalVerifications
      }
    }
  });
}));

/**
 * @route GET /api/insured/policies
 * @desc Get user's policies
 * @access Insured only
 */
router.get('/policies', [
  query('status').optional().isIn(['active', 'expired', 'suspended']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const insuredId = req.user.insured_id;

  const where = { insured_id: insuredId };
  if (status) {
    where.status = status;
  }

  const policies = await Policy.findAndCountAll({
    where,
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'license_number', 'contact_email', 'contact_phone']
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
 * @route GET /api/insured/policies/:id
 * @desc Get specific policy details
 * @access Insured only
 */
router.get('/policies/:id', [
  param('id').isInt().withMessage('Valid policy ID required')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const insuredId = req.user.insured_id;

  const policy = await Policy.findOne({
    where: {
      id: id,
      insured_id: insuredId
    },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'license_number', 'contact_email', 'contact_phone', 'address']
      }
    ]
  });

  if (!policy) {
    return res.status(404).json({
      success: false,
      error: 'Policy not found or access denied'
    });
  }

  res.json({
    success: true,
    policy
  });
}));

/**
 * @route GET /api/insured/policies/:id/certificate
 * @desc Download policy certificate
 * @access Insured only
 */
router.get('/policies/:id/certificate', [
  param('id').isInt().withMessage('Valid policy ID required')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const insuredId = req.user.insured_id;

  const policy = await Policy.findOne({
    where: {
      id: id,
      insured_id: insuredId
    },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['name', 'license_number', 'logo_url']
      }
    ]
  });

  if (!policy) {
    return res.status(404).json({
      success: false,
      error: 'Policy not found or access denied'
    });
  }

  // Generate certificate data (in a real implementation, this would generate a PDF)
  const certificateData = {
    policy_number: policy.policy_number,
    holder_name: policy.holder_name,
    policy_type: policy.policy_type,
    coverage_amount: policy.coverage_amount,
    start_date: policy.start_date,
    expiry_date: policy.expiry_date,
    company_name: policy.company.name,
    company_license: policy.company.license_number,
    issued_date: new Date().toISOString(),
    certificate_id: `CERT-${policy.id}-${Date.now()}`
  };

  res.json({
    success: true,
    certificate: certificateData,
    download_url: `/api/insured/policies/${id}/certificate/pdf` // Placeholder for PDF generation
  });
}));

/**
 * @route POST /api/insured/verify-policy
 * @desc Verify a policy (for officers to verify)
 * @access Insured only (but this creates a verification request)
 */
router.post('/verify-policy', [
  body('policy_number').notEmpty().withMessage('Policy number is required'),
  body('holder_name').notEmpty().withMessage('Holder name is required'),
  body('verification_purpose').optional().isString()
], asyncHandler(async (req, res) => {
  const { policy_number, holder_name, verification_purpose } = req.body;
  const userId = req.user.id;

  // Find the policy
  const policy = await Policy.findOne({
    where: {
      policy_number: policy_number,
      holder_name: holder_name
    },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'license_number']
      }
    ]
  });

  if (!policy) {
    return res.status(404).json({
      success: false,
      error: 'Policy not found'
    });
  }

  // Check if policy belongs to the insured user
  if (policy.insured_id !== req.user.insured_id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied to this policy'
    });
  }

  // Create verification record (this would typically be handled by an officer)
  const verification = await Verification.create({
    policy_number: policy.policy_number,
    holder_name: policy.holder_name,
    expiry_date: policy.expiry_date,
    officer_id: null, // No officer assigned yet
    company_id: policy.company_id,
    status: 'pending',
    verification_method: 'insured_request',
    additional_notes: verification_purpose || 'Policy verification requested by insured',
    location: 'Requested by insured user'
  });

  res.status(201).json({
    success: true,
    message: 'Policy verification request submitted',
    verification: {
      id: verification.id,
      status: verification.status,
      policy_number: verification.policy_number,
      company_name: policy.company.name
    }
  });
}));

/**
 * @route GET /api/insured/claims
 * @desc Get user's claims
 * @access Insured only
 */
router.get('/claims', [
  query('status').optional().isIn(['reported', 'settled', 'denied']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;

  const where = { insured_id: userId };
  if (status) {
    where.status = status;
  }

  const claims = await Claim.findAndCountAll({
    where,
    include: [
      {
        model: Policy,
        as: 'policy',
        attributes: ['id', 'policy_number', 'holder_name', 'policy_type']
      },
      {
        model: Company,
        as: 'insurer',
        attributes: ['id', 'name', 'contact_email', 'contact_phone']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

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
 * @route POST /api/insured/claims
 * @desc Report a new claim
 * @access Insured only
 */
router.post('/claims', [
  body('policy_id').isInt().withMessage('Policy ID is required'),
  body('description').notEmpty().withMessage('Claim description is required'),
  body('incident_date').optional().isISO8601(),
  body('incident_location').optional().isString(),
  body('estimated_amount').optional().isDecimal(),
  body('uploads').optional().isArray()
], asyncHandler(async (req, res) => {
  const { 
    policy_id, 
    description, 
    incident_date, 
    incident_location, 
    estimated_amount,
    uploads 
  } = req.body;
  const userId = req.user.id;

  // Verify policy belongs to user
  const policy = await Policy.findOne({
    where: {
      id: policy_id,
      insured_id: req.user.insured_id
    },
    include: [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
      }
    ]
  });

  if (!policy) {
    return res.status(404).json({
      success: false,
      error: 'Policy not found or access denied'
    });
  }

  // Create claim
  const claim = await Claim.create({
    policy_id: policy.id,
    insured_id: userId,
    insurer_id: policy.company_id,
    description,
    uploads_json: uploads ? { files: uploads } : null,
    status: 'reported'
  });

  res.status(201).json({
    success: true,
    message: 'Claim reported successfully',
    claim: {
      id: claim.id,
      policy_number: policy.policy_number,
      description: claim.description,
      status: claim.status,
      created_at: claim.created_at
    }
  });
}));

/**
 * @route GET /api/insured/claims/:id
 * @desc Get specific claim details
 * @access Insured only
 */
router.get('/claims/:id', [
  param('id').isInt().withMessage('Valid claim ID required')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const claim = await Claim.findOne({
    where: {
      id: id,
      insured_id: userId
    },
    include: [
      {
        model: Policy,
        as: 'policy',
        attributes: ['id', 'policy_number', 'holder_name', 'policy_type', 'coverage_amount']
      },
      {
        model: Company,
        as: 'insurer',
        attributes: ['id', 'name', 'contact_email', 'contact_phone']
      }
    ]
  });

  if (!claim) {
    return res.status(404).json({
      success: false,
      error: 'Claim not found or access denied'
    });
  }

  res.json({
    success: true,
    claim
  });
}));

/**
 * @route GET /api/insured/statements
 * @desc Get user's policy statements
 * @access Insured only
 */
router.get('/statements', [
  query('policy_id').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { policy_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const insuredId = req.user.insured_id;

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
        where: { insured_id: insuredId },
        attributes: ['id', 'policy_number', 'holder_name', 'policy_type'],
        include: [
          {
            model: Company,
            as: 'company',
            attributes: ['id', 'name', 'license_number']
          }
        ]
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
 * @route GET /api/insured/statements/:id/download
 * @desc Download statement
 * @access Insured only
 */
router.get('/statements/:id/download', [
  param('id').isInt().withMessage('Valid statement ID required')
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  const insuredId = req.user.insured_id;

  const statement = await Statement.findOne({
    where: { id },
    include: [
      {
        model: Policy,
        as: 'policy',
        where: { insured_id: insuredId },
        attributes: ['id', 'policy_number', 'holder_name']
      }
    ]
  });

  if (!statement) {
    return res.status(404).json({
      success: false,
      error: 'Statement not found or access denied'
    });
  }

  // In a real implementation, this would generate and return a PDF
  res.json({
    success: true,
    statement: statement.details_json,
    download_url: `/api/insured/statements/${id}/pdf` // Placeholder for PDF generation
  });
}));

/**
 * @route GET /api/insured/verification-history
 * @desc Get policy verification history
 * @access Insured only
 */
router.get('/verification-history', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const insuredId = req.user.insured_id;

  // Get user's policies first
  const userPolicies = await Policy.findAll({
    where: { insured_id: insuredId },
    attributes: ['policy_number']
  });

  const policyNumbers = userPolicies.map(p => p.policy_number);

  const verifications = await Verification.findAndCountAll({
    where: {
      policy_number: {
        [require('sequelize').Op.in]: policyNumbers
      }
    },
    include: [
      {
        model: User,
        as: 'officer',
        attributes: ['id', 'first_name', 'last_name', 'username']
      },
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
    verifications: verifications.rows,
    pagination: {
      total: verifications.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(verifications.count / limit)
    }
  });
}));

module.exports = router;
