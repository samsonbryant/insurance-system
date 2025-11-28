const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { User, Company, AuditLog } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

// Get all users (Admin only)
router.get('/', requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['admin', 'company', 'officer']),
  query('company_id').optional().isInt(),
  query('is_active').optional().isBoolean(),
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
  const { role, company_id, is_active, search } = req.query;

  const whereClause = {};
  if (role) whereClause.role = role;
  if (company_id) whereClause.company_id = company_id;
  if (is_active !== undefined) whereClause.is_active = is_active === 'true';

  if (search) {
    whereClause[Op.or] = [
      { username: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    include: [
      { model: Company, as: 'company', attributes: ['id', 'name', 'license_number'] }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password_hash', 'password_reset_token', 'password_reset_expires'] }
  });

  res.json({
    users,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Get user by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [
      { model: Company, as: 'company', attributes: ['id', 'name', 'license_number'] }
    ],
    attributes: { exclude: ['password_hash', 'password_reset_token', 'password_reset_expires'] }
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Users can only see their own profile unless admin
  if (req.userRole !== 'admin' && req.userId !== user.id) {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }

  res.json({ user });
}));

// Create user (Admin only)
router.post('/', requireAdmin, [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'company', 'officer', 'cbl', 'insurer', 'insured']).withMessage('Invalid role'),
  body('company_id').optional().isInt(),
  body('first_name').optional().isLength({ min: 1, max: 50 }),
  body('last_name').optional().isLength({ min: 1, max: 50 }),
  body('phone').optional().isLength({ min: 10, max: 20 })
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
    username,
    email,
    password,
    role,
    company_id,
    first_name,
    last_name,
    phone
  } = req.body;

  // Check if username already exists
  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    return res.status(409).json({
      error: 'Username already exists',
      code: 'USERNAME_EXISTS'
    });
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(409).json({
      error: 'Email already exists',
      code: 'EMAIL_EXISTS'
    });
  }

  // Validate company_id for company and officer roles
  if ((role === 'company' || role === 'insurer') && !company_id) {
    return res.status(400).json({
      error: 'Company ID is required for company and insurer roles',
      code: 'COMPANY_ID_REQUIRED'
    });
  }

  if (company_id) {
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(400).json({
        error: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }
  }

  const user = await User.create({
    username,
    email,
    password_hash: password, // Will be hashed by model hook
    role,
    company_id,
    first_name,
    last_name,
    phone,
    is_active: true
  });

  await AuditLog.create({
    user_id: req.userId,
    action: 'USER_CREATE',
    entity_type: 'USER',
    entity_id: user.id,
    details: {
      username: user.username,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'high',
    status: 'success'
  });

  res.status(201).json({
    message: 'User created successfully',
    user: user.toJSON()
  });
}));

// Update user (Admin only)
router.put('/:id', requireAdmin, [
  body('username').optional().isLength({ min: 3, max: 50 }),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['admin', 'company', 'officer', 'cbl', 'insurer', 'insured']),
  body('company_id').optional().isInt(),
  body('first_name').optional().isLength({ min: 1, max: 50 }),
  body('last_name').optional().isLength({ min: 1, max: 50 }),
  body('phone').optional().isLength({ min: 10, max: 20 }),
  body('is_active').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const user = await User.findByPk(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  const {
    username,
    email,
    role,
    company_id,
    first_name,
    last_name,
    phone,
    is_active
  } = req.body;

  // Check for duplicate username
  if (username && username !== user.username) {
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({
        error: 'Username already exists',
        code: 'USERNAME_EXISTS'
      });
    }
  }

  // Check for duplicate email
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        error: 'Email already exists',
        code: 'EMAIL_EXISTS'
      });
    }
  }

  // Validate company_id
  if (company_id) {
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(400).json({
        error: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }
  }

  const updateData = {};
  const allowedFields = ['username', 'email', 'role', 'company_id', 'first_name', 'last_name', 'phone', 'is_active'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  await user.update(updateData);

  await AuditLog.create({
    user_id: req.userId,
    action: 'USER_UPDATE',
    entity_type: 'USER',
    entity_id: user.id,
    details: {
      username: user.username,
      updated_fields: Object.keys(updateData)
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'high',
    status: 'success'
  });

  res.json({
    message: 'User updated successfully',
    user: user.toJSON()
  });
}));

// Change user password (Admin only)
router.put('/:id/password', requireAdmin, [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { password } = req.body;
  const user = await User.findByPk(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  await user.update({ password_hash: password }); // Will be hashed by model hook

  await AuditLog.create({
    user_id: req.userId,
    action: 'USER_PASSWORD_CHANGE',
    entity_type: 'USER',
    entity_id: user.id,
    details: { username: user.username },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'high',
    status: 'success'
  });

  res.json({
    message: 'Password updated successfully'
  });
}));

// Delete user (Admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Prevent admin from deleting themselves
  if (user.id === req.userId) {
    return res.status(400).json({
      error: 'Cannot delete your own account',
      code: 'CANNOT_DELETE_SELF'
    });
  }

  await user.destroy();

  await AuditLog.create({
    user_id: req.userId,
    action: 'USER_DELETE',
    entity_type: 'USER',
    entity_id: user.id,
    details: {
      username: user.username,
      email: user.email,
      role: user.role
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'critical',
    status: 'success'
  });

  res.json({
    message: 'User deleted successfully'
  });
}));

// Get user statistics (Admin only)
router.get('/stats/summary', requireAdmin, asyncHandler(async (req, res) => {
  const [totalUsers, roleCounts, activeUsers, recentUsers] = await Promise.all([
    User.count(),
    User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['role']
    }),
    User.count({ where: { is_active: true } }),
    User.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })
  ]);

  const stats = {
    total_users: totalUsers,
    active_users: activeUsers,
    inactive_users: totalUsers - activeUsers,
    recent_users_30d: recentUsers,
    role_breakdown: roleCounts.reduce((acc, item) => {
      acc[item.role] = parseInt(item.dataValues.count);
      return acc;
    }, {})
  };

  res.json({ stats });
}));

module.exports = router;
