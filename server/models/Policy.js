const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const Policy = sequelize.define('Policy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  policy_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  holder_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  holder_id_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  holder_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  holder_email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  policy_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'auto',
    validate: {
      isIn: [['auto', 'motor_third_party', 'motor_comprehensive', 'guaranteed_bond', 'indemnity_bond', 'fire', 'marine', 'life', 'medical', 'travel', 'real_property', 'health', 'property', 'business', 'other']]
    }
  },
  coverage_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  premium_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  details_json: {
    type: DataTypes.JSON,
    allowNull: true
  },
  hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  last_synced: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled', 'suspended'),
    defaultValue: 'active'
  },
  vehicle_info: {
    type: DataTypes.JSON,
    allowNull: true
  },
  additional_beneficiaries: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'policies',
  hooks: {
    beforeCreate: (policy) => {
      // Generate hash for policy verification
      const policyData = {
        policy_number: policy.policy_number,
        holder_name: policy.holder_name,
        expiry_date: policy.expiry_date,
        company_id: policy.company_id
      };
      policy.hash = crypto.createHash('sha256')
        .update(JSON.stringify(policyData))
        .digest('hex');
    },
    beforeUpdate: (policy) => {
      if (policy.changed('policy_number') || 
          policy.changed('holder_name') || 
          policy.changed('expiry_date') || 
          policy.changed('company_id')) {
        const policyData = {
          policy_number: policy.policy_number,
          holder_name: policy.holder_name,
          expiry_date: policy.expiry_date,
          company_id: policy.company_id
        };
        policy.hash = crypto.createHash('sha256')
          .update(JSON.stringify(policyData))
          .digest('hex');
      }
    }
  }
});

module.exports = Policy;
