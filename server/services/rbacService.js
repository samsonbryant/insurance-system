const { User, Company, Policy, Claim, Statement, Approval, Bond } = require('../models');

class RBACService {
  /**
   * Check if user has permission
   */
  static hasPermission(userRole, permission) {
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
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }

  /**
   * Get user's accessible resources
   */
  static async getUserResources(userRole, userId, companyId, insuredId = null) {
    const resources = {
      policies: [],
      claims: [],
      statements: [],
      bonds: [],
      approvals: []
    };

    try {
      switch (userRole) {
        case 'admin':
        case 'cbl':
          // Admin and CBL can access all resources
          resources.policies = await Policy.findAll();
          resources.claims = await Claim.findAll();
          resources.statements = await Statement.findAll();
          resources.bonds = await Bond.findAll();
          resources.approvals = await Approval.findAll();
          break;

        case 'insurer':
          // Insurers can access their company's resources
          resources.policies = await Policy.findAll({ where: { company_id: companyId } });
          resources.claims = await Claim.findAll({ where: { insurer_id: companyId } });
          resources.bonds = await Bond.findAll({
            include: [{
              model: Policy,
              as: 'policy',
              where: { company_id: companyId }
            }]
          });
          break;

        case 'insured':
          // Insured users can access their own resources
          if (insuredId) {
            resources.policies = await Policy.findAll({ where: { insured_id: insuredId } });
            resources.claims = await Claim.findAll({ where: { insured_id: userId } });
            resources.statements = await Statement.findAll({
              include: [{
                model: Policy,
                as: 'policy',
                where: { insured_id: insuredId }
              }]
            });
          }
          break;

        case 'company':
          // Company users can access their company's resources
          resources.policies = await Policy.findAll({ where: { company_id: companyId } });
          break;

        case 'officer':
          // Officers can access verification-related resources
          // This would be handled by the verification routes
          break;
      }

      return resources;
    } catch (error) {
      console.error('Error getting user resources:', error);
      throw error;
    }
  }

  /**
   * Check if user can access specific resource
   */
  static async canAccessResource(userRole, userId, companyId, resourceType, resourceId, insuredId = null) {
    try {
      switch (resourceType) {
        case 'policy':
          const policy = await Policy.findByPk(resourceId);
          if (!policy) return false;

          if (userRole === 'admin' || userRole === 'cbl') return true;
          if (userRole === 'insurer' && policy.company_id === companyId) return true;
          if (userRole === 'insured' && policy.insured_id === insuredId) return true;
          return false;

        case 'claim':
          const claim = await Claim.findByPk(resourceId);
          if (!claim) return false;

          if (userRole === 'admin' || userRole === 'cbl') return true;
          if (userRole === 'insurer' && claim.insurer_id === companyId) return true;
          if (userRole === 'insured' && claim.insured_id === userId) return true;
          return false;

        case 'company':
          const company = await Company.findByPk(resourceId);
          if (!company) return false;

          if (userRole === 'admin' || userRole === 'cbl') return true;
          if (userRole === 'insurer' && company.id === companyId) return true;
          return false;

        case 'approval':
          if (userRole === 'admin' || userRole === 'cbl') return true;
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  }

  /**
   * Get filtered query options for user
   */
  static getQueryOptions(userRole, userId, companyId, insuredId = null) {
    const options = { where: {} };

    switch (userRole) {
      case 'insurer':
      case 'company':
        options.where.company_id = companyId;
        break;

      case 'insured':
        if (insuredId) {
          options.where.insured_id = insuredId;
        }
        break;

      case 'admin':
      case 'cbl':
        // No additional filters for admin/CBL
        break;
    }

    return options;
  }
}

module.exports = RBACService;