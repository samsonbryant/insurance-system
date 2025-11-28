const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Verification, Policy, Company, User, AuditLog } = require('../models');
const { requireOfficer, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

// Get verifications with filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['valid', 'fake', 'pending', 'expired', 'not_found']),
  query('officer_id').optional().isInt(),
  query('company_id').optional().isInt(),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('policy_number').optional().isLength({ min: 1 })
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
    status, 
    officer_id, 
    company_id, 
    date_from, 
    date_to, 
    policy_number 
  } = req.query;

  const whereClause = {};

  // Officers can only see their own verifications unless admin
  if (req.userRole === 'officer') {
    whereClause.officer_id = req.userId;
  } else if (officer_id) {
    whereClause.officer_id = officer_id;
  }

  if (status) whereClause.status = status;
  if (company_id) whereClause.company_id = company_id;
  if (policy_number) whereClause.policy_number = policy_number;

  if (date_from || date_to) {
    whereClause.created_at = {};
    if (date_from) whereClause.created_at[Op.gte] = date_from;
    if (date_to) whereClause.created_at[Op.lte] = date_to;
  }

  let verifications;
  let count;
  
  try {
    const result = await Verification.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'officer', 
          attributes: ['id', 'username', 'first_name', 'last_name'], 
          required: false 
        },
        { 
          model: Company, 
          as: 'company', 
          attributes: ['id', 'name', 'license_number'], 
          required: false 
        },
        { 
          model: Policy, 
          as: 'policy', 
          attributes: ['id', 'policy_number', 'holder_name', 'expiry_date'],
          required: false 
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true // Important for count with includes
    });
    
    verifications = result.rows;
    count = result.count;
  } catch (error) {
    console.error('Error fetching verifications:', error);
    // Fallback: fetch without includes if there's an association error
    const result = await Verification.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
    verifications = result.rows;
    count = result.count;
  }

  res.json({
    verifications,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Get verification by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const verification = await Verification.findByPk(req.params.id, {
    include: [
      { model: User, as: 'officer', attributes: ['id', 'username', 'first_name', 'last_name'] },
      { model: Company, as: 'company', attributes: ['id', 'name', 'license_number'] },
      { model: Policy, as: 'policy' }
    ]
  });

  if (!verification) {
    return res.status(404).json({
      error: 'Verification not found',
      code: 'VERIFICATION_NOT_FOUND'
    });
  }

  // Officers can only see their own verifications unless admin
  if (req.userRole === 'officer' && req.userId !== verification.officer_id) {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }

  res.json({ verification });
}));

// Public verification endpoint (no authentication required)
router.post('/public/verify', [
  body('policy_number').notEmpty().withMessage('Policy number is required'),
  body('holder_name').notEmpty().withMessage('Holder name is required'),
  body('holder_id_number').optional().isLength({ min: 1 }),
  body('expiry_date').optional().isISO8601(),
  body('verification_method').optional().isIn(['scan', 'manual', 'api']),
  body('location').optional().isLength({ min: 1, max: 255 }),
  body('latitude').optional().isDecimal(),
  body('longitude').optional().isDecimal(),
  body('document_image').optional().isLength({ min: 1 }),
  body('additional_notes').optional().isLength({ min: 0, max: 1000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const startTime = Date.now();
  const {
    policy_number,
    holder_name,
    holder_id_number,
    expiry_date,
    verification_method = 'manual',
    location,
    latitude,
    longitude,
    document_image,
    additional_notes
  } = req.body;

  // Get location from IP if not provided
  let finalLocation = location;
  if (!finalLocation) {
    try {
      // Try to get location from geolocation or IP
      const ip = req.ip || req.connection.remoteAddress;
      finalLocation = `IP: ${ip}`;
    } catch (e) {
      finalLocation = 'Unknown';
    }
  }

  // Search for matching policies
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
      { model: Company, as: 'company', attributes: ['id', 'name', 'status'] }
    ],
    limit: 5
  });

  let verificationResult = {
    status: 'not_found',
    reason: 'No matching policy found',
    confidence_score: 0,
    matched_policy: null
  };

  if (policies.length > 0) {
    // Find the best match
    const bestMatch = policies.find(policy => 
      policy.holder_name.toLowerCase() === holder_name.toLowerCase() &&
      (!expiry_date || policy.expiry_date === expiry_date)
    ) || policies[0];

    const isExactMatch = bestMatch.holder_name.toLowerCase() === holder_name.toLowerCase();
    const isExpiryMatch = !expiry_date || bestMatch.expiry_date === expiry_date;
    const isCompanyActive = bestMatch.company.status === 'approved';

    if (isExactMatch && isExpiryMatch && isCompanyActive) {
      // Check if policy is expired
      const today = new Date();
      const expiryDate = new Date(bestMatch.expiry_date);
      
      if (expiryDate < today) {
        verificationResult = {
          status: 'expired',
          reason: 'Policy has expired',
          confidence_score: 95,
          matched_policy: bestMatch
        };
      } else {
        verificationResult = {
          status: 'valid',
          reason: 'Policy verified successfully',
          confidence_score: 100,
          matched_policy: bestMatch
        };
      }
    } else if (isCompanyActive) {
      verificationResult = {
        status: 'fake',
        reason: 'Policy details do not match',
        confidence_score: 85,
        matched_policy: bestMatch
      };
    } else {
      verificationResult = {
        status: 'fake',
        reason: 'Insurance company not approved',
        confidence_score: 90,
        matched_policy: bestMatch
      };
    }
  }

  // Create verification record (no officer_id for public verification)
  const verificationData = {
    policy_number,
    holder_name,
    expiry_date,
    officer_id: null, // Public verification has no officer
    company_id: verificationResult.matched_policy?.company_id || null,
    status: verificationResult.status,
    reason: verificationResult.reason,
    location: finalLocation,
    latitude,
    longitude,
    verification_method,
    document_image,
    confidence_score: verificationResult.confidence_score,
    additional_notes,
    verified_at: new Date(),
    response_time_ms: Date.now() - startTime
  };
  
  // Only include holder_id_number if provided
  if (holder_id_number) {
    verificationData.holder_id_number = holder_id_number;
  }
  
  const verification = await Verification.create(verificationData);

  // Log verification attempt (no user_id for public verification)
  await AuditLog.create({
    user_id: null,
    action: 'DOCUMENT_VERIFY_PUBLIC',
    entity_type: 'VERIFICATION',
    entity_id: verification.id,
    details: {
      policy_number,
      holder_name,
      status: verificationResult.status,
      confidence_score: verificationResult.confidence_score,
      response_time_ms: verification.response_time_ms,
      location: finalLocation,
      is_public: true
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: verificationResult.status === 'fake' ? 'high' : 'medium',
    status: 'success'
  });

  // Send real-time notification to admin and insurer rooms
  const io = req.app.get('io');
  if (io) {
    const notificationData = {
      verification_id: verification.id,
      policy_number,
      holder_name,
      status: verificationResult.status,
      location: finalLocation,
      latitude,
      longitude,
      timestamp: new Date(),
      is_public: true
    };
    
    // Notify admin and insurer rooms
    io.to('admin').emit('new_verification', notificationData);
    io.to('insurer').emit('new_verification', notificationData);
    
    // Also emit to all connected clients for real-time updates
    io.emit('verification_update', notificationData);
    
    // Special alert for fake detections
    if (verificationResult.status === 'fake') {
      io.to('admin').emit('fake_detected', notificationData);
      io.to('insurer').emit('fake_detected', notificationData);
    }
  }

  res.json({
    message: 'Verification completed',
    verification: {
      id: verification.id,
      status: verification.status,
      reason: verification.reason,
      confidence_score: verification.confidence_score,
      verified_at: verification.verified_at,
      response_time_ms: verification.response_time_ms,
      location: finalLocation
    },
    matched_policy: verificationResult.matched_policy ? {
      id: verificationResult.matched_policy.id,
      policy_number: verificationResult.matched_policy.policy_number,
      holder_name: verificationResult.matched_policy.holder_name,
      expiry_date: verificationResult.matched_policy.expiry_date,
      company: verificationResult.matched_policy.company
    } : null
  });
}));

// Verify document (Officer only)
router.post('/verify', requireOfficer, [
  body('policy_number').notEmpty().withMessage('Policy number is required'),
  body('holder_name').notEmpty().withMessage('Holder name is required'),
  body('expiry_date').optional().isISO8601(),
  body('verification_method').optional().isIn(['scan', 'manual', 'api']),
  body('location').optional().isLength({ min: 1, max: 255 }),
  body('latitude').optional().isDecimal(),
  body('longitude').optional().isDecimal(),
  body('document_image').optional().isLength({ min: 1 }),
  body('additional_notes').optional().isLength({ min: 0, max: 1000 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const startTime = Date.now();
  const {
    policy_number,
    holder_name,
    expiry_date,
    verification_method = 'manual',
    location,
    latitude,
    longitude,
    document_image,
    additional_notes
  } = req.body;

  // Search for matching policies
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
      { model: Company, as: 'company', attributes: ['id', 'name', 'status'] }
    ],
    limit: 5
  });

  let verificationResult = {
    status: 'not_found',
    reason: 'No matching policy found',
    confidence_score: 0,
    matched_policy: null
  };

  if (policies.length > 0) {
    // Find the best match
    const bestMatch = policies.find(policy => 
      policy.holder_name.toLowerCase() === holder_name.toLowerCase() &&
      policy.expiry_date === expiry_date
    ) || policies[0];

    const isExactMatch = bestMatch.holder_name.toLowerCase() === holder_name.toLowerCase();
    const isExpiryMatch = !expiry_date || bestMatch.expiry_date === expiry_date;
    const isCompanyActive = bestMatch.company.status === 'approved';

    if (isExactMatch && isExpiryMatch && isCompanyActive) {
      // Check if policy is expired
      const today = new Date();
      const expiryDate = new Date(bestMatch.expiry_date);
      
      if (expiryDate < today) {
        verificationResult = {
          status: 'expired',
          reason: 'Policy has expired',
          confidence_score: 95,
          matched_policy: bestMatch
        };
      } else {
        verificationResult = {
          status: 'valid',
          reason: 'Policy verified successfully',
          confidence_score: 100,
          matched_policy: bestMatch
        };
      }
    } else if (isCompanyActive) {
      verificationResult = {
        status: 'fake',
        reason: 'Policy details do not match',
        confidence_score: 85,
        matched_policy: bestMatch
      };
    } else {
      verificationResult = {
        status: 'fake',
        reason: 'Insurance company not approved',
        confidence_score: 90,
        matched_policy: bestMatch
      };
    }
  }

  // Create verification record
  const verification = await Verification.create({
    policy_number,
    holder_name,
    expiry_date,
    officer_id: req.userId,
    company_id: verificationResult.matched_policy?.company_id || null,
    status: verificationResult.status,
    reason: verificationResult.reason,
    location,
    latitude,
    longitude,
    verification_method,
    document_image,
    confidence_score: verificationResult.confidence_score,
    additional_notes,
    verified_at: new Date(),
    response_time_ms: Date.now() - startTime
  });

  // Log verification attempt
  await AuditLog.create({
    user_id: req.userId,
    action: 'DOCUMENT_VERIFY',
    entity_type: 'VERIFICATION',
    entity_id: verification.id,
    details: {
      policy_number,
      holder_name,
      status: verificationResult.status,
      confidence_score: verificationResult.confidence_score,
      response_time_ms: verification.response_time_ms
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: verificationResult.status === 'fake' ? 'high' : 'medium',
    status: 'success'
  });

  // Send real-time notification if fake detected
  if (verificationResult.status === 'fake') {
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('fake_detected', {
        verification_id: verification.id,
        policy_number,
        holder_name,
        officer: req.user.username,
        location,
        timestamp: new Date()
      });
    }
  }

  res.json({
    message: 'Verification completed',
    verification: {
      id: verification.id,
      status: verification.status,
      reason: verification.reason,
      confidence_score: verification.confidence_score,
      verified_at: verification.verified_at,
      response_time_ms: verification.response_time_ms
    },
    matched_policy: verificationResult.matched_policy ? {
      id: verificationResult.matched_policy.id,
      policy_number: verificationResult.matched_policy.policy_number,
      holder_name: verificationResult.matched_policy.holder_name,
      expiry_date: verificationResult.matched_policy.expiry_date,
      company: verificationResult.matched_policy.company
    } : null
  });
}));

// Update verification status (Admin only)
router.put('/:id/status', requireAdmin, [
  body('status').isIn(['valid', 'fake', 'pending', 'expired', 'not_found']).withMessage('Invalid status'),
  body('reason').optional().isLength({ min: 1, max: 500 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { status, reason } = req.body;
  const verification = await Verification.findByPk(req.params.id);

  if (!verification) {
    return res.status(404).json({
      error: 'Verification not found',
      code: 'VERIFICATION_NOT_FOUND'
    });
  }

  const oldStatus = verification.status;
  await verification.update({
    status,
    reason: reason || verification.reason,
    verified_at: new Date()
  });

  await AuditLog.create({
    user_id: req.userId,
    action: 'VERIFICATION_STATUS_UPDATE',
    entity_type: 'VERIFICATION',
    entity_id: verification.id,
    details: {
      policy_number: verification.policy_number,
      old_status: oldStatus,
      new_status: status,
      reason
    },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'medium',
    status: 'success'
  });

  res.json({
    message: 'Verification status updated successfully',
    verification
  });
}));

// Get verification statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const whereClause = {};

  // Officers can only see their own stats unless admin
  if (req.userRole === 'officer') {
    whereClause.officer_id = req.userId;
  }

  const [totalVerifications, statusCounts, recentVerifications] = await Promise.all([
    Verification.count({ where: whereClause }),
    Verification.findAll({
      attributes: [
        'status',
        [Verification.sequelize.fn('COUNT', Verification.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status']
    }),
    Verification.count({
      where: {
        ...whereClause,
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
  ]);

  const stats = {
    total_verifications: totalVerifications,
    recent_verifications_24h: recentVerifications,
    status_breakdown: statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.dataValues.count);
      return acc;
    }, {}),
    fake_detection_rate: statusCounts.find(s => s.status === 'fake')?.dataValues.count || 0
  };

  res.json({ stats });
}));

module.exports = router;
