const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await User.findByPk(decoded.userId, {
      include: [{
        association: 'company',
        required: false
      }]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ 
        error: 'Invalid or inactive user',
        code: 'INVALID_USER' 
      });
    }

    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    req.companyId = user.company_id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED' 
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NO_AUTH' 
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.userRole
      });
    }

    next();
  };
};

const requireAdmin = requireRole('admin');
const requireCompany = requireRole('company');
const requireOfficer = requireRole('officer');
const requireCBL = requireRole('cbl');
const requireInsurer = requireRole('insurer');
const requireInsured = requireRole('insured');
const requireCompanyOrAdmin = requireRole(['company', 'admin']);
const requireCBLOrAdmin = requireRole(['cbl', 'admin']);
const requireInsurerOrAdmin = requireRole(['insurer', 'admin']);
const requireInsuredOrAdmin = requireRole(['insured', 'admin']);
const requireAnyRole = requireRole(['admin', 'officer', 'company', 'cbl', 'insurer', 'insured']);

const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      role: user.role,
      companyId: user.company_id
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'ivas-system',
      audience: 'ivas-client'
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'ivas-system',
      audience: 'ivas-client'
    }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireCompany,
  requireOfficer,
  requireCBL,
  requireInsurer,
  requireInsured,
  requireCompanyOrAdmin,
  requireCBLOrAdmin,
  requireInsurerOrAdmin,
  requireInsuredOrAdmin,
  requireAnyRole,
  generateToken,
  generateRefreshToken
};
