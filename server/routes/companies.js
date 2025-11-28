const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Company, User, Policy, AuditLog } = require('../models');
const { requireAdmin, requireCompanyOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

// Public endpoint to get approved companies (for public claims form)
router.get('/public', [
  query('status').optional().isIn(['approved']),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const whereClause = { status: 'approved', is_active: true };

  const companies = await Company.findAll({
    where: whereClause,
    attributes: ['id', 'name', 'license_number'],
    limit,
    order: [['name', 'ASC']]
  });

  res.json({
    companies
  });
}));

// Get all companies (Admin only)
router.get('/', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'approved', 'suspended', 'rejected']),
  query('search').optional().isLength({ min: 1 })
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
  const { status, search } = req.query;

  const whereClause = {};
  if (status) whereClause.status = status;
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { license_number: { [Op.like]: `%${search}%` } },
      { contact_email: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows: companies } = await Company.findAndCountAll({
    where: whereClause,
    include: [
      { model: User, as: 'approvedBy', attributes: ['id', 'username', 'first_name', 'last_name'] }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  res.json({
    companies,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Get company by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const company = await Company.findByPk(req.params.id, {
    include: [
      { model: User, as: 'approvedBy', attributes: ['id', 'username', 'first_name', 'last_name'] },
      { model: User, as: 'users', attributes: ['id', 'username', 'first_name', 'last_name', 'role', 'is_active'] }
    ]
  });

  if (!company) {
    return res.status(404).json({
      error: 'Company not found',
      code: 'COMPANY_NOT_FOUND'
    });
  }

  // Non-admin users can only see their own company
  if (req.userRole !== 'admin' && req.companyId !== company.id) {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }

  res.json({ company });
}));

// Register new company
router.post('/register', [
  body('name').notEmpty().withMessage('Company name is required'),
  body('license_number').notEmpty().withMessage('License number is required'),
  body('contact_email').isEmail().withMessage('Valid email is required'),
  body('contact_phone').optional().isLength({ min: 10, max: 20 }),
  body('address').optional().isLength({ min: 5, max: 500 }),
  body('api_endpoint').optional().isURL().withMessage('Valid API endpoint URL required'),
  body('sync_frequency').optional().isIn(['realtime', 'hourly', 'daily', 'weekly', 'manual'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const {
    name,
    license_number,
    contact_email,
    contact_phone,
    address,
    api_endpoint,
    sync_frequency = 'daily'
  } = req.body;

  // Check if license number already exists
  const existingCompany = await Company.findOne({
    where: { license_number }
  });

  if (existingCompany) {
    return res.status(409).json({
      error: 'Company with this license number already exists',
      code: 'LICENSE_EXISTS'
    });
  }

  // Check if email already exists
  const existingEmail = await Company.findOne({
    where: { contact_email }
  });

  if (existingEmail) {
    return res.status(409).json({
      error: 'Company with this email already exists',
      code: 'EMAIL_EXISTS'
    });
  }

  const company = await Company.create({
    name,
    license_number,
    contact_email,
    contact_phone,
    address,
    api_endpoint,
    sync_frequency,
    status: 'pending'
  });

  await AuditLog.create({
    user_id: req.userId,
    action: 'COMPANY_REGISTER',
    entity_type: 'COMPANY',
    entity_id: company.id,
    details: { company_name: name, license_number },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'medium',
    status: 'success'
  });

  res.status(201).json({
    message: 'Company registered successfully',
    company
  });
}));

// Approve/reject company (Admin only)
router.put('/:id/approve', requireAdmin, [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('api_key').optional().isLength({ min: 10 }),
  body('api_secret').optional().isLength({ min: 10 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { status, api_key, api_secret } = req.body;
  const company = await Company.findByPk(req.params.id);

  if (!company) {
    return res.status(404).json({
      error: 'Company not found',
      code: 'COMPANY_NOT_FOUND'
    });
  }

  if (company.status !== 'pending') {
    return res.status(400).json({
      error: 'Company status cannot be changed',
      code: 'STATUS_NOT_PENDING'
    });
  }

  await company.update({
    status,
    admin_approved_by: req.userId,
    api_key: api_key || company.api_key,
    api_secret: api_secret || company.api_secret
  });

  await AuditLog.create({
    user_id: req.userId,
    action: 'COMPANY_APPROVE',
    entity_type: 'COMPANY',
    entity_id: company.id,
    details: { 
      company_name: company.name, 
      new_status: status,
      license_number: company.license_number
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'high',
    status: 'success'
  });

  res.json({
    message: `Company ${status} successfully`,
    company
  });
}));

// Update company (Company users or Admin)
router.put('/:id', requireCompanyOrAdmin, [
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('contact_email').optional().isEmail(),
  body('contact_phone').optional().isLength({ min: 10, max: 20 }),
  body('address').optional().isLength({ min: 5, max: 500 }),
  body('api_endpoint').optional().isURL(),
  body('sync_frequency').optional().isIn(['realtime', 'hourly', 'daily', 'weekly', 'manual'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const company = await Company.findByPk(req.params.id);

  if (!company) {
    return res.status(404).json({
      error: 'Company not found',
      code: 'COMPANY_NOT_FOUND'
    });
  }

  // Company users can only update their own company
  if (req.userRole === 'company' && req.companyId !== company.id) {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }

  const updateData = {};
  const allowedFields = ['name', 'contact_email', 'contact_phone', 'address', 'api_endpoint', 'sync_frequency'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  await company.update(updateData);

  await AuditLog.create({
    user_id: req.userId,
    action: 'COMPANY_UPDATE',
    entity_type: 'COMPANY',
    entity_id: company.id,
    details: { 
      company_name: company.name,
      updated_fields: Object.keys(updateData)
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'medium',
    status: 'success'
  });

  res.json({
    message: 'Company updated successfully',
    company
  });
}));

// Suspend/activate company (Admin only)
router.put('/:id/status', requireAdmin, [
  body('is_active').isBoolean().withMessage('is_active must be boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { is_active } = req.body;
  const company = await Company.findByPk(req.params.id);

  if (!company) {
    return res.status(404).json({
      error: 'Company not found',
      code: 'COMPANY_NOT_FOUND'
    });
  }

  await company.update({ is_active });

  await AuditLog.create({
    user_id: req.userId,
    action: 'COMPANY_STATUS_CHANGE',
    entity_type: 'COMPANY',
    entity_id: company.id,
    details: { 
      company_name: company.name,
      new_status: is_active ? 'active' : 'suspended'
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'high',
    status: 'success'
  });

  res.json({
    message: `Company ${is_active ? 'activated' : 'suspended'} successfully`,
    company
  });
}));

// Get company statistics (Admin or Company)
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const company = await Company.findByPk(req.params.id);

  if (!company) {
    return res.status(404).json({
      error: 'Company not found',
      code: 'COMPANY_NOT_FOUND'
    });
  }

  // Non-admin users can only see their own company stats
  if (req.userRole !== 'admin' && req.companyId !== company.id) {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }

  const [policyCount, verificationCount, userCount] = await Promise.all([
    Policy.count({ where: { company_id: company.id } }),
    Policy.count({ 
      where: { company_id: company.id },
      include: [{ model: Policy, as: 'verifications' }]
    }),
    User.count({ where: { company_id: company.id } })
  ]);

  res.json({
    stats: {
      total_policies: policyCount,
      total_verifications: verificationCount,
      total_users: userCount,
      last_sync: company.last_sync,
      sync_status: company.sync_status
    }
  });
}));

module.exports = router;
