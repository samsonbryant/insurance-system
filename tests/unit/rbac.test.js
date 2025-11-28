const { sequelize } = require('../setup');
const { User, Company } = require('../../server/models');
const rbacService = require('../../server/services/rbacService');

describe('RBAC Service Tests', () => {
  let adminUser, companyUser, officerUser, cblUser, insurerUser, insuredUser;

  beforeEach(async () => {
    // Create test users for each role
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: 'hashedpassword',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });

    companyUser = await User.create({
      username: 'company',
      email: 'company@example.com',
      password_hash: 'hashedpassword',
      role: 'company',
      first_name: 'Company',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });

    officerUser = await User.create({
      username: 'officer',
      email: 'officer@example.com',
      password_hash: 'hashedpassword',
      role: 'officer',
      first_name: 'Officer',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });

    cblUser = await User.create({
      username: 'cbl',
      email: 'cbl@example.com',
      password_hash: 'hashedpassword',
      role: 'cbl',
      first_name: 'CBL',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });

    insurerUser = await User.create({
      username: 'insurer',
      email: 'insurer@example.com',
      password_hash: 'hashedpassword',
      role: 'insurer',
      first_name: 'Insurer',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });

    insuredUser = await User.create({
      username: 'insured',
      email: 'insured@example.com',
      password_hash: 'hashedpassword',
      role: 'insured',
      first_name: 'Insured',
      last_name: 'User',
      phone: '1234567890',
      is_active: true
    });
  });

  test('should return correct permissions for admin role', () => {
    const permissions = rbacService.getPermissions('admin');
    
    expect(permissions).toContain('users:read');
    expect(permissions).toContain('users:write');
    expect(permissions).toContain('users:delete');
    expect(permissions).toContain('companies:read');
    expect(permissions).toContain('companies:write');
    expect(permissions).toContain('companies:delete');
    expect(permissions).toContain('policies:read');
    expect(permissions).toContain('policies:write');
    expect(permissions).toContain('policies:delete');
    expect(permissions).toContain('verifications:read');
    expect(permissions).toContain('verifications:write');
    expect(permissions).toContain('reports:read');
    expect(permissions).toContain('reports:write');
  });

  test('should return correct permissions for company role', () => {
    const permissions = rbacService.getPermissions('company');
    
    expect(permissions).toContain('policies:read');
    expect(permissions).toContain('policies:write');
    expect(permissions).toContain('verifications:read');
    expect(permissions).toContain('reports:read');
    expect(permissions).not.toContain('users:write');
    expect(permissions).not.toContain('companies:write');
  });

  test('should return correct permissions for officer role', () => {
    const permissions = rbacService.getPermissions('officer');
    
    expect(permissions).toContain('verifications:read');
    expect(permissions).toContain('verifications:write');
    expect(permissions).toContain('policies:read');
    expect(permissions).toContain('reports:read');
    expect(permissions).not.toContain('users:write');
    expect(permissions).not.toContain('policies:write');
  });

  test('should return correct permissions for cbl role', () => {
    const permissions = rbacService.getPermissions('cbl');
    
    expect(permissions).toContain('companies:read');
    expect(permissions).toContain('companies:write');
    expect(permissions).toContain('approvals:read');
    expect(permissions).toContain('approvals:write');
    expect(permissions).toContain('bonds:read');
    expect(permissions).toContain('bonds:write');
    expect(permissions).toContain('reference_checks:read');
    expect(permissions).toContain('reference_checks:write');
    expect(permissions).toContain('reports:read');
    expect(permissions).not.toContain('users:write');
  });

  test('should return correct permissions for insurer role', () => {
    const permissions = rbacService.getPermissions('insurer');
    
    expect(permissions).toContain('policies:read');
    expect(permissions).toContain('policies:write');
    expect(permissions).toContain('claims:read');
    expect(permissions).toContain('claims:write');
    expect(permissions).toContain('statements:read');
    expect(permissions).toContain('statements:write');
    expect(permissions).toContain('bonds:read');
    expect(permissions).toContain('bonds:write');
    expect(permissions).toContain('reports:read');
    expect(permissions).not.toContain('users:write');
  });

  test('should return correct permissions for insured role', () => {
    const permissions = rbacService.getPermissions('insured');
    
    expect(permissions).toContain('policies:read');
    expect(permissions).toContain('claims:read');
    expect(permissions).toContain('claims:write');
    expect(permissions).toContain('statements:read');
    expect(permissions).toContain('verifications:read');
    expect(permissions).not.toContain('policies:write');
    expect(permissions).not.toContain('users:write');
  });

  test('should check permissions correctly', () => {
    // Admin should have all permissions
    expect(rbacService.hasPermission('admin', 'users:write')).toBe(true);
    expect(rbacService.hasPermission('admin', 'companies:delete')).toBe(true);
    expect(rbacService.hasPermission('admin', 'policies:read')).toBe(true);

    // Company should have limited permissions
    expect(rbacService.hasPermission('company', 'policies:read')).toBe(true);
    expect(rbacService.hasPermission('company', 'policies:write')).toBe(true);
    expect(rbacService.hasPermission('company', 'users:write')).toBe(false);
    expect(rbacService.hasPermission('company', 'companies:delete')).toBe(false);

    // Officer should have verification permissions
    expect(rbacService.hasPermission('officer', 'verifications:read')).toBe(true);
    expect(rbacService.hasPermission('officer', 'verifications:write')).toBe(true);
    expect(rbacService.hasPermission('officer', 'policies:write')).toBe(false);

    // CBL should have approval permissions
    expect(rbacService.hasPermission('cbl', 'approvals:read')).toBe(true);
    expect(rbacService.hasPermission('cbl', 'approvals:write')).toBe(true);
    expect(rbacService.hasPermission('cbl', 'companies:write')).toBe(true);
    expect(rbacService.hasPermission('cbl', 'users:write')).toBe(false);

    // Insurer should have policy and claim permissions
    expect(rbacService.hasPermission('insurer', 'policies:read')).toBe(true);
    expect(rbacService.hasPermission('insurer', 'policies:write')).toBe(true);
    expect(rbacService.hasPermission('insurer', 'claims:read')).toBe(true);
    expect(rbacService.hasPermission('insurer', 'claims:write')).toBe(true);
    expect(rbacService.hasPermission('insurer', 'users:write')).toBe(false);

    // Insured should have limited read permissions
    expect(rbacService.hasPermission('insured', 'policies:read')).toBe(true);
    expect(rbacService.hasPermission('insured', 'claims:read')).toBe(true);
    expect(rbacService.hasPermission('insured', 'claims:write')).toBe(true);
    expect(rbacService.hasPermission('insured', 'policies:write')).toBe(false);
    expect(rbacService.hasPermission('insured', 'users:write')).toBe(false);
  });

  test('should check role hierarchy correctly', () => {
    // Admin should have access to all roles
    expect(rbacService.hasRole('admin', 'admin')).toBe(true);
    expect(rbacService.hasRole('admin', 'company')).toBe(true);
    expect(rbacService.hasRole('admin', 'officer')).toBe(true);
    expect(rbacService.hasRole('admin', 'cbl')).toBe(true);
    expect(rbacService.hasRole('admin', 'insurer')).toBe(true);
    expect(rbacService.hasRole('admin', 'insured')).toBe(true);

    // CBL should have access to insurer and insured
    expect(rbacService.hasRole('cbl', 'cbl')).toBe(true);
    expect(rbacService.hasRole('cbl', 'insurer')).toBe(true);
    expect(rbacService.hasRole('cbl', 'insured')).toBe(true);
    expect(rbacService.hasRole('cbl', 'admin')).toBe(false);

    // Insurer should only have access to insured
    expect(rbacService.hasRole('insurer', 'insurer')).toBe(true);
    expect(rbacService.hasRole('insurer', 'insured')).toBe(true);
    expect(rbacService.hasRole('insurer', 'admin')).toBe(false);
    expect(rbacService.hasRole('insurer', 'cbl')).toBe(false);

    // Insured should only have access to themselves
    expect(rbacService.hasRole('insured', 'insured')).toBe(true);
    expect(rbacService.hasRole('insured', 'admin')).toBe(false);
    expect(rbacService.hasRole('insured', 'insurer')).toBe(false);
  });

  test('should validate resource access correctly', () => {
    // Admin can access any resource
    expect(rbacService.canAccessResource('admin', 'users', 'read')).toBe(true);
    expect(rbacService.canAccessResource('admin', 'companies', 'write')).toBe(true);
    expect(rbacService.canAccessResource('admin', 'policies', 'delete')).toBe(true);

    // Company can only access their own resources
    expect(rbacService.canAccessResource('company', 'policies', 'read')).toBe(true);
    expect(rbacService.canAccessResource('company', 'policies', 'write')).toBe(true);
    expect(rbacService.canAccessResource('company', 'users', 'write')).toBe(false);

    // Officer can only read policies and write verifications
    expect(rbacService.canAccessResource('officer', 'policies', 'read')).toBe(true);
    expect(rbacService.canAccessResource('officer', 'verifications', 'write')).toBe(true);
    expect(rbacService.canAccessResource('officer', 'policies', 'write')).toBe(false);

    // CBL can manage companies and approvals
    expect(rbacService.canAccessResource('cbl', 'companies', 'write')).toBe(true);
    expect(rbacService.canAccessResource('cbl', 'approvals', 'write')).toBe(true);
    expect(rbacService.canAccessResource('cbl', 'bonds', 'write')).toBe(true);
    expect(rbacService.canAccessResource('cbl', 'users', 'write')).toBe(false);

    // Insurer can manage policies and claims
    expect(rbacService.canAccessResource('insurer', 'policies', 'write')).toBe(true);
    expect(rbacService.canAccessResource('insurer', 'claims', 'write')).toBe(true);
    expect(rbacService.canAccessResource('insurer', 'statements', 'write')).toBe(true);
    expect(rbacService.canAccessResource('insurer', 'users', 'write')).toBe(false);

    // Insured can only read policies and write claims
    expect(rbacService.canAccessResource('insured', 'policies', 'read')).toBe(true);
    expect(rbacService.canAccessResource('insured', 'claims', 'write')).toBe(true);
    expect(rbacService.canAccessResource('insured', 'statements', 'read')).toBe(true);
    expect(rbacService.canAccessResource('insured', 'policies', 'write')).toBe(false);
  });
});
