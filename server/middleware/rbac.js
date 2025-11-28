const { User, Company, Policy, Claim, Statement, Approval, Bond } = require('../models');

/**
 * Check if user has required permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    // For now, we'll implement basic role-based permissions
    // In a full implementation, this would check against a permissions table
    const userRole = req.user.role;
    
    // Define role permissions
    const rolePermissions = {
      admin: ['*'], // Admin has all permissions
      cbl: [
        'companies.view', 'companies.manage', 'companies.approve', 'companies.suspend',
        'policies.approve', 'policies.decline', 'policies.view',
        'claims.view', 'claims.manage',
        'bonds.view', 'bonds.manage',
        'approvals.view', 'approvals.approve', 'approvals.decline',
        'reference_check.perform', 'reference_check.view'
      ],
      insurer: [
        'policies.view', 'policies.create', 'policies.update',
        'claims.view', 'claims.settle', 'claims.deny',
        'statements.view', 'statements.generate',
        'bonds.view', 'bonds.create',
        'reports.view'
      ],
      insured: [
        'policies.view', 'policies.verify',
        'claims.view', 'claims.create',
        'statements.view', 'statements.download',
        'verification_history.view'
      ],
      officer: [
        'verifications.view', 'verifications.create', 'verifications.update',
        'policies.verify'
      ],
      company: [
        'policies.view', 'policies.create', 'policies.update',
        'users.view', 'users.manage',
        'reports.view'
      ]
    };

    const userPermissions = rolePermissions[userRole] || [];
    
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      code: 'INSUFFICIENT_PERMISSIONS',
      required: permission,
      current: userRole
    });
  };
};

/**
 * Check if user has access to specific resource
 */
const requireResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const resourceId = req.params.id || req.params[`${resourceType}Id`];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'Resource ID required',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      let resource;
      const userRole = req.user.role;
      const userId = req.user.id;
      const companyId = req.user.company_id;

      switch (resourceType) {
        case 'policy':
          resource = await Policy.findByPk(resourceId);
          if (resource) {
            // Check if user has access to this policy
            if (userRole === 'admin' || 
                userRole === 'cbl' ||
                (userRole === 'insurer' && resource.company_id === companyId) ||
                (userRole === 'insured' && resource.insured_id === req.user.insured_id)) {
              req.resource = resource;
              return next();
            }
          }
          break;

        case 'claim':
          resource = await Claim.findByPk(resourceId);
          if (resource) {
            // Check if user has access to this claim
            if (userRole === 'admin' || 
                userRole === 'cbl' ||
                (userRole === 'insurer' && resource.insurer_id === companyId) ||
                (userRole === 'insured' && resource.insured_id === userId)) {
              req.resource = resource;
              return next();
            }
          }
          break;

        case 'company':
          resource = await Company.findByPk(resourceId);
          if (resource) {
            // Check if user has access to this company
            if (userRole === 'admin' || 
                userRole === 'cbl' ||
                (userRole === 'insurer' && resource.id === companyId)) {
              req.resource = resource;
              return next();
            }
          }
          break;

        case 'approval':
          resource = await Approval.findByPk(resourceId);
          if (resource) {
            // Check if user has access to this approval
            if (userRole === 'admin' || userRole === 'cbl') {
              req.resource = resource;
              return next();
            }
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid resource type',
            code: 'INVALID_RESOURCE_TYPE'
          });
      }

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      return res.status(403).json({
        success: false,
        error: 'Access denied to resource',
        code: 'RESOURCE_ACCESS_DENIED'
      });

    } catch (error) {
      console.error('Resource access check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Validate user role and company status
 */
const validateUserRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NO_AUTH'
    });
  }

  const user = req.user;
  
  // Check if user is active
  if (!user.is_active) {
    return res.status(403).json({
      success: false,
      error: 'User account is inactive',
      code: 'USER_INACTIVE'
    });
  }

  // Check company status for company-related roles
  if (['insurer', 'company'].includes(user.role) && user.company_id) {
    // This would typically check company status from database
    // For now, we'll assume company is active if user is active
  }

  // Check CBL registration status for insurers
  if (user.role === 'insurer' && user.company_id) {
    // This would check if company is CBL registered
    // For now, we'll allow all insurers
  }

  next();
};

/**
 * Apply resource filters based on user role
 */
const applyResourceFilters = (resourceType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    const userRole = req.user.role;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    // Initialize query options
    req.queryOptions = req.queryOptions || { where: {} };

    switch (resourceType) {
      case 'policies':
        if (userRole === 'insurer' || userRole === 'company') {
          req.queryOptions.where.company_id = companyId;
        } else if (userRole === 'insured') {
          req.queryOptions.where.insured_id = req.user.insured_id;
        }
        break;

      case 'claims':
        if (userRole === 'insurer') {
          req.queryOptions.where.insurer_id = companyId;
        } else if (userRole === 'insured') {
          req.queryOptions.where.insured_id = userId;
        }
        break;

      case 'statements':
        if (userRole === 'insurer') {
          // Filter statements by company policies
          req.queryOptions.include = req.queryOptions.include || [];
          req.queryOptions.include.push({
            model: Policy,
            as: 'policy',
            where: { company_id: companyId },
            required: true
          });
        } else if (userRole === 'insured') {
          // Filter statements by user's policies
          req.queryOptions.include = req.queryOptions.include || [];
          req.queryOptions.include.push({
            model: Policy,
            as: 'policy',
            where: { insured_id: req.user.insured_id },
            required: true
          });
        }
        break;

      case 'bonds':
        if (userRole === 'insurer') {
          // Filter bonds by company policies
          req.queryOptions.include = req.queryOptions.include || [];
          req.queryOptions.include.push({
            model: Policy,
            as: 'policy',
            where: { company_id: companyId },
            required: true
          });
        }
        break;

      case 'approvals':
        if (userRole === 'cbl') {
          // CBL can see all approvals
        } else if (userRole === 'insurer') {
          // Insurers can see approvals for their company
          req.queryOptions.where = {
            [require('sequelize').Op.or]: [
              { entity_type: 'insurer', entity_id: companyId },
              { entity_type: 'policy', entity_id: { [require('sequelize').Op.in]: [] } } // Would need to get policy IDs
            ]
          };
        }
        break;
    }

    next();
  };
};

module.exports = {
  requirePermission,
  requireResourceAccess,
  validateUserRole,
  applyResourceFilters
};