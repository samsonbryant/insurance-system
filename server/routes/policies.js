const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Policy, Company, Verification, AuditLog } = require('../models');
const { requireCompanyOrAdmin, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const crypto = require('crypto');

const router = express.Router();

// Get policies with filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('company_id').optional().isInt(),
  query('policy_type').optional().isIn(['auto', 'health', 'life', 'property', 'business', 'other']),
  query('status').optional().isIn(['active', 'expired', 'cancelled', 'suspended']),
  query('search').optional().isLength({ min: 1 }),
  query('expiry_date_from').optional().isISO8601(),
  query('expiry_date_to').optional().isISO8601()
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
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { 
    company_id, 
    policy_type, 
    status, 
    search, 
    expiry_date_from, 
    expiry_date_to 
  } = req.query;

  const whereClause = {};

  // Company users can only see their own policies
  if (req.userRole === 'company') {
    whereClause.company_id = req.companyId;
  } else if (company_id) {
    whereClause.company_id = company_id;
  }

  if (policy_type) whereClause.policy_type = policy_type;
  if (status) whereClause.status = status;

  if (search) {
    whereClause[Op.or] = [
      { policy_number: { [Op.like]: `%${search}%` } },
      { holder_name: { [Op.like]: `%${search}%` } },
      { holder_id_number: { [Op.like]: `%${search}%` } }
    ];
  }

  if (expiry_date_from || expiry_date_to) {
    whereClause.expiry_date = {};
    if (expiry_date_from) whereClause.expiry_date[Op.gte] = expiry_date_from;
    if (expiry_date_to) whereClause.expiry_date[Op.lte] = expiry_date_to;
  }

  const { count, rows: policies } = await Policy.findAndCountAll({
    where: whereClause,
    include: [
      { model: Company, as: 'company', attributes: ['id', 'name', 'license_number'] }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  res.json({
    policies,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Get policy by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const policy = await Policy.findByPk(req.params.id, {
    include: [
      { model: Company, as: 'company', attributes: ['id', 'name', 'license_number'] },
      { model: Verification, as: 'verifications', limit: 10, order: [['created_at', 'DESC']] }
    ]
  });

  if (!policy) {
    return res.status(404).json({
      error: 'Policy not found',
      code: 'POLICY_NOT_FOUND'
    });
  }

  // Company users can only see their own policies
  if (req.userRole === 'company' && req.companyId !== policy.company_id) {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }

  res.json({ policy });
}));

// Search policies for verification
router.get('/search/verify', [
  query('policy_number').notEmpty().withMessage('Policy number is required'),
  query('holder_name').optional().isLength({ min: 1 }),
  query('expiry_date').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { policy_number, holder_name, expiry_date } = req.query;

  const whereClause = {
    policy_number: policy_number
  };

  if (holder_name) {
    whereClause.holder_name = { [Op.like]: `%${holder_name}%` };
  }

  if (expiry_date) {
    whereClause.expiry_date = expiry_date;
  }

  const policies = await Policy.findAll({
    where: whereClause,
    include: [
      { model: Company, as: 'company', attributes: ['id', 'name', 'license_number', 'status'] }
    ],
    limit: 10
  });

  res.json({ policies });
}));

// Sync policies (Company or Admin)
router.post('/sync', requireCompanyOrAdmin, [
  body('policies').isArray({ min: 1 }).withMessage('Policies array is required'),
  body('policies.*.policy_number').notEmpty().withMessage('Policy number is required'),
  body('policies.*.holder_name').notEmpty().withMessage('Holder name is required'),
  body('policies.*.start_date').isISO8601().withMessage('Valid start date is required'),
  body('policies.*.expiry_date').isISO8601().withMessage('Valid expiry date is required'),
  body('policies.*.policy_type').isIn(['auto', 'health', 'life', 'property', 'business', 'other']),
  body('company_id').optional().isInt()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { policies, company_id } = req.body;
  const targetCompanyId = req.userRole === 'admin' ? company_id : req.companyId;

  if (!targetCompanyId) {
    return res.status(400).json({
      error: 'Company ID is required',
      code: 'COMPANY_ID_REQUIRED'
    });
  }

  // Verify company exists and is approved
  const company = await Company.findByPk(targetCompanyId);
  if (!company || company.status !== 'approved') {
    return res.status(400).json({
      error: 'Company not found or not approved',
      code: 'INVALID_COMPANY'
    });
  }

  const results = {
    created: 0,
    updated: 0,
    errors: []
  };

  for (const policyData of policies) {
    try {
      // Check if policy already exists
      const existingPolicy = await Policy.findOne({
        where: { 
          policy_number: policyData.policy_number,
          company_id: targetCompanyId
        }
      });

      if (existingPolicy) {
        // Update existing policy
        await existingPolicy.update({
          ...policyData,
          company_id: targetCompanyId,
          last_synced: new Date()
        });
        results.updated++;
      } else {
        // Create new policy
        await Policy.create({
          ...policyData,
          company_id: targetCompanyId,
          last_synced: new Date()
        });
        results.created++;
      }
    } catch (error) {
      results.errors.push({
        policy_number: policyData.policy_number,
        error: error.message
      });
    }
  }

  // Update company sync status
  await company.update({
    last_sync: new Date(),
    sync_status: results.errors.length > 0 ? 'failed' : 'success',
    sync_error: results.errors.length > 0 ? JSON.stringify(results.errors) : null
  });

  await AuditLog.create({
    user_id: req.userId,
    action: 'POLICY_SYNC',
    entity_type: 'POLICY',
    details: { 
      company_id: targetCompanyId,
      policies_count: policies.length,
      results
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'medium',
    status: results.errors.length > 0 ? 'warning' : 'success'
  });

  res.json({
    message: 'Policy sync completed',
    results
  });
}));

// Create single policy (Company or Admin)
router.post('/', requireCompanyOrAdmin, [
  body('policy_number').notEmpty().withMessage('Policy number is required'),
  body('holder_name').notEmpty().withMessage('Holder name is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
  body('policy_type').isIn(['auto', 'health', 'life', 'property', 'business', 'other']),
  body('company_id').optional().isInt(),
  body('holder_id_number').optional().isLength({ min: 1 }),
  body('holder_phone').optional().isLength({ min: 10, max: 20 }),
  body('holder_email').optional().isEmail(),
  body('coverage_amount').optional().isDecimal(),
  body('premium_amount').optional().isDecimal(),
  body('vehicle_info').optional().isObject(),
  body('additional_beneficiaries').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { company_id, ...policyData } = req.body;
  const targetCompanyId = req.userRole === 'admin' ? company_id : req.companyId;

  if (!targetCompanyId) {
    return res.status(400).json({
      error: 'Company ID is required',
      code: 'COMPANY_ID_REQUIRED'
    });
  }

  // Check if policy number already exists for this company
  const existingPolicy = await Policy.findOne({
    where: { 
      policy_number: policyData.policy_number,
      company_id: targetCompanyId
    }
  });

  if (existingPolicy) {
    return res.status(409).json({
      error: 'Policy number already exists for this company',
      code: 'POLICY_EXISTS'
    });
  }

  // Generate hash for policy verification
  const hashData = {
    policy_number: policyData.policy_number,
    holder_name: policyData.holder_name,
    expiry_date: policyData.expiry_date,
    company_id: targetCompanyId
  };
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(hashData))
    .digest('hex');

  const policy = await Policy.create({
    ...policyData,
    company_id: targetCompanyId,
    hash: hash,
    last_synced: new Date()
  });

  await AuditLog.create({
    user_id: req.userId,
    action: 'POLICY_CREATE',
    entity_type: 'POLICY',
    entity_id: policy.id,
    details: { 
      policy_number: policy.policy_number,
      holder_name: policy.holder_name,
      company_id: targetCompanyId
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'medium',
    status: 'success'
  });

  res.status(201).json({
    message: 'Policy created successfully',
    policy
  });
}));

// Update policy (Company or Admin)
router.put('/:id', requireCompanyOrAdmin, [
  body('holder_name').optional().isLength({ min: 1 }),
  body('start_date').optional().isISO8601(),
  body('expiry_date').optional().isISO8601(),
  body('policy_type').optional().isIn(['auto', 'health', 'life', 'property', 'business', 'other']),
  body('status').optional().isIn(['active', 'expired', 'cancelled', 'suspended']),
  body('holder_id_number').optional().isLength({ min: 1 }),
  body('holder_phone').optional().isLength({ min: 10, max: 20 }),
  body('holder_email').optional().isEmail(),
  body('coverage_amount').optional().isDecimal(),
  body('premium_amount').optional().isDecimal(),
  body('vehicle_info').optional().isObject(),
  body('additional_beneficiaries').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const policy = await Policy.findByPk(req.params.id);

  if (!policy) {
    return res.status(404).json({
      error: 'Policy not found',
      code: 'POLICY_NOT_FOUND'
    });
  }

  // Company users can only update their own policies
  if (req.userRole === 'company' && req.companyId !== policy.company_id) {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }

  const updateData = {};
  const allowedFields = [
    'holder_name', 'start_date', 'expiry_date', 'policy_type', 'status',
    'holder_id_number', 'holder_phone', 'holder_email', 'coverage_amount',
    'premium_amount', 'vehicle_info', 'additional_beneficiaries'
  ];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  await policy.update({
    ...updateData,
    last_synced: new Date()
  });

  await AuditLog.create({
    user_id: req.userId,
    action: 'POLICY_UPDATE',
    entity_type: 'POLICY',
    entity_id: policy.id,
    details: { 
      policy_number: policy.policy_number,
      updated_fields: Object.keys(updateData)
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'medium',
    status: 'success'
  });

  res.json({
    message: 'Policy updated successfully',
    policy
  });
}));

// Delete policy (Admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const policy = await Policy.findByPk(req.params.id);

  if (!policy) {
    return res.status(404).json({
      error: 'Policy not found',
      code: 'POLICY_NOT_FOUND'
    });
  }

  await policy.destroy();

  await AuditLog.create({
    user_id: req.userId,
    action: 'POLICY_DELETE',
    entity_type: 'POLICY',
    entity_id: policy.id,
    details: { 
      policy_number: policy.policy_number,
      holder_name: policy.holder_name
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'high',
    status: 'success'
  });

  res.json({
    message: 'Policy deleted successfully'
  });
}));

module.exports = router;
