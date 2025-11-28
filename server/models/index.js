const User = require('./User');
const Company = require('./Company');
const Policy = require('./Policy');
const Verification = require('./Verification');
const AuditLog = require('./AuditLog');
const Claim = require('./Claim');
const Statement = require('./Statement');
const Approval = require('./Approval');
const ReferenceCheck = require('./ReferenceCheck');
const Bond = require('./Bond');

// User associations
User.belongsTo(Company, { 
  foreignKey: 'company_id', 
  as: 'company' 
});

User.hasMany(Verification, { 
  foreignKey: 'officer_id', 
  as: 'verifications' 
});

User.hasMany(AuditLog, { 
  foreignKey: 'user_id', 
  as: 'auditLogs' 
});

// Company associations
Company.hasMany(User, { 
  foreignKey: 'company_id', 
  as: 'users' 
});

Company.hasMany(Policy, { 
  foreignKey: 'company_id', 
  as: 'policies' 
});

Company.hasMany(Verification, { 
  foreignKey: 'company_id', 
  as: 'verifications' 
});

Company.belongsTo(User, { 
  foreignKey: 'admin_approved_by', 
  as: 'approvedBy' 
});

// Policy associations
Policy.belongsTo(Company, { 
  foreignKey: 'company_id', 
  as: 'company' 
});

Policy.hasMany(Verification, { 
  foreignKey: 'policy_number', 
  sourceKey: 'policy_number',
  as: 'verifications' 
});

// Claims/Statements/Bonds associations
Policy.hasMany(Claim, { foreignKey: 'policy_id', as: 'claims' });
Claim.belongsTo(Policy, { foreignKey: 'policy_id', as: 'policy' });

User.hasMany(Claim, { foreignKey: 'insured_id', as: 'claimsAsInsured' });
User.hasMany(Claim, { foreignKey: 'insurer_id', as: 'claimsAsInsurer' });
Claim.belongsTo(User, { foreignKey: 'insured_id', as: 'insured' });
Claim.belongsTo(User, { foreignKey: 'insurer_id', as: 'insurer' });

Policy.hasOne(Statement, { foreignKey: 'policy_id', as: 'statement' });
Statement.belongsTo(Policy, { foreignKey: 'policy_id', as: 'policy' });

Policy.hasMany(Bond, { foreignKey: 'policy_id', as: 'bonds' });
Bond.belongsTo(Policy, { foreignKey: 'policy_id', as: 'policy' });

// Verification associations
Verification.belongsTo(User, { 
  foreignKey: 'officer_id', 
  as: 'officer' 
});

Verification.belongsTo(Company, { 
  foreignKey: 'company_id', 
  as: 'company' 
});

Verification.belongsTo(Policy, { 
  foreignKey: 'policy_number', 
  targetKey: 'policy_number',
  as: 'policy' 
});

// AuditLog associations
AuditLog.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
});

// Approval associations
Approval.belongsTo(User, { 
  foreignKey: 'approver_id', 
  as: 'approver' 
});

User.hasMany(Approval, { 
  foreignKey: 'approver_id', 
  as: 'approvals' 
});

module.exports = {
  User,
  Company,
  Policy,
  Verification,
  AuditLog,
  Claim,
  Statement,
  Approval,
  ReferenceCheck,
  Bond
};
