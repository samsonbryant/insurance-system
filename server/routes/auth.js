const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const { AuditLog } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Login endpoint
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username or email
    let user = await User.findOne({
      where: { username: username },
      include: [{
        association: 'company',
        required: false
      }]
    });
    
    if (!user) {
      user = await User.findOne({
        where: { email: username },
        include: [{
          association: 'company',
          required: false
        }]
      });
    }

    if (!user) {
      // Try to log failed login attempt (don't fail if audit log fails)
      try {
        await AuditLog.create({
          user_id: null, // No user found
          action: 'LOGIN_FAILED',
          entity_type: 'USER',
          details: { username, reason: 'User not found' },
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          severity: 'medium',
          status: 'failed'
        });
      } catch (auditError) {
        // Log error but don't fail the login response
        console.error('Error creating audit log for failed login:', auditError);
      }

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      // Try to log failed login attempt (don't fail if audit log fails)
      try {
        await AuditLog.create({
          user_id: user.id,
          action: 'LOGIN_FAILED',
          entity_type: 'USER',
          details: { username, reason: 'Account inactive' },
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          severity: 'medium',
          status: 'failed'
        });
      } catch (auditError) {
        // Log error but don't fail the login response
        console.error('Error creating audit log for inactive account:', auditError);
      }

      return res.status(401).json({
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      // Try to log failed login attempt (don't fail if audit log fails)
      try {
        await AuditLog.create({
          user_id: user.id,
          action: 'LOGIN_FAILED',
          entity_type: 'USER',
          details: { username, reason: 'Invalid password' },
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          severity: 'medium',
          status: 'failed'
        });
      } catch (auditError) {
        // Log error but don't fail the login response
        console.error('Error creating audit log for failed login:', auditError);
      }

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'CONFIG_ERROR'
      });
    }

    // Generate tokens
    let accessToken, refreshToken;
    try {
      accessToken = generateToken(user);
      refreshToken = generateRefreshToken(user);
    } catch (tokenError) {
      console.error('Error generating tokens:', tokenError);
      return res.status(500).json({
        error: 'Failed to generate authentication tokens',
        code: 'TOKEN_GENERATION_ERROR'
      });
    }

    // Log successful login
    try {
      await AuditLog.create({
        user_id: user.id,
        action: 'LOGIN_SUCCESS',
        entity_type: 'USER',
        details: { username, role: user.role },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        severity: 'low',
        status: 'success'
      });
    } catch (auditError) {
      // Log error but don't fail the login
      console.error('Error creating audit log:', auditError);
    }

    // Get user JSON (handle potential errors)
    let userJson;
    try {
      userJson = user.toJSON();
      // Ensure company is properly handled (can be null)
      if (!userJson.company) {
        userJson.company = null;
      }
    } catch (jsonError) {
      console.error('Error converting user to JSON:', jsonError);
      // Fallback to basic user data
      userJson = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        is_active: user.is_active,
        last_login: user.last_login,
        company: null
      };
    }

    res.json({
      message: 'Login successful',
      user: userJson,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  } catch (error) {
    // Log the full error for debugging
    console.error('Login route error:', error);
    console.error('Error stack:', error.stack);
    
    // Return a proper error response
    return res.status(500).json({
      error: 'Internal server error during login',
      code: 'LOGIN_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during login'
    });
  }
}));

// Refresh token endpoint
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const user = await User.findByPk(decoded.userId, {
      include: [{
        association: 'company',
        required: false
      }]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
}));

// Logout endpoint (client-side token invalidation)
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In a more sophisticated system, you might maintain a blacklist of tokens
  // For now, we'll just log the logout action
  
  if (req.userId) {
    await AuditLog.create({
      user_id: req.userId,
      action: 'LOGOUT',
      entity_type: 'USER',
      details: {},
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      severity: 'low',
      status: 'success'
    });
  }

  res.json({ message: 'Logout successful' });
}));

// Get current user profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.userId, {
    include: [{
      association: 'company',
      required: false
    }]
  });

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    user: user.toJSON()
  });
}));

// Update user profile
router.put('/profile', authenticateToken, [
  body('first_name').optional().isLength({ min: 1, max: 50 }),
  body('last_name').optional().isLength({ min: 1, max: 50 }),
  body('phone').optional().isLength({ min: 5, max: 25 }),
  body('email').optional().isEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { first_name, last_name, phone, email } = req.body;
  const user = await User.findByPk(req.userId);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Email already in use',
        code: 'EMAIL_EXISTS'
      });
    }
  }

  await user.update({
    first_name: first_name || user.first_name,
    last_name: last_name || user.last_name,
    phone: phone || user.phone,
    email: email || user.email
  });

  await AuditLog.create({
    user_id: user.id,
    action: 'PROFILE_UPDATE',
    entity_type: 'USER',
    details: { updated_fields: Object.keys(req.body) },
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
    severity: 'low',
    status: 'success'
  });

  res.json({
    message: 'Profile updated successfully',
    user: user.toJSON()
  });
}));

module.exports = router;
