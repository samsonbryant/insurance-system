const { Policy, Company } = require('../models');
const { Op } = require('sequelize');

class PolicyNumberService {
  /**
   * Generate policy number for a company
   * Format: {COMPANY_PREFIX}-{POLICY_TYPE}-{YEAR}-{SEQUENTIAL_NUMBER}
   * Example: LIC-AUTO-2025-001
   */
  static async generatePolicyNumber(companyId, policyType, year = null) {
    try {
      // Get current year if not provided
      const currentYear = year || new Date().getFullYear();
      
      // Get company information
      const company = await Company.findByPk(companyId);
      if (!company) {
        throw new Error('Company not found');
      }
      
      // Generate company prefix from license number or name
      const companyPrefix = this.generateCompanyPrefix(company);
      
      // Get the next sequential number for this company, year, and policy type
      const nextNumber = await this.getNextPolicyNumber(companyId, policyType, currentYear);
      
      // Format the policy number
      const policyNumber = `${companyPrefix}-${policyType.toUpperCase()}-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
      
      return {
        policyNumber,
        companyPrefix,
        policyType: policyType.toUpperCase(),
        year: currentYear,
        sequenceNumber: nextNumber
      };
    } catch (error) {
      console.error('Error generating policy number:', error);
      throw error;
    }
  }

  /**
   * Generate company prefix from license number or name
   */
  static generateCompanyPrefix(company) {
    if (company.license_number) {
      // Extract prefix from license number (e.g., "LIC-001-2023" -> "LIC")
      const parts = company.license_number.split('-');
      if (parts.length > 0) {
        return parts[0].toUpperCase();
      }
    }
    
    // Fallback to company name initials
    const nameWords = company.name.split(' ');
    if (nameWords.length >= 2) {
      return nameWords.map(word => word.charAt(0)).join('').toUpperCase();
    } else {
      return company.name.substring(0, 3).toUpperCase();
    }
  }

  /**
   * Get the next sequential number for a company, policy type, and year
   */
  static async getNextPolicyNumber(companyId, policyType, year) {
    try {
      // Find the highest sequence number for this company, policy type, and year
      const lastPolicy = await Policy.findOne({
        where: {
          company_id: companyId,
          policy_type: policyType,
          policy_year: year
        },
        order: [['policy_counter', 'DESC']]
      });

      if (lastPolicy && lastPolicy.policy_counter) {
        return lastPolicy.policy_counter + 1;
      }

      // If no policies found, start from 1
      return 1;
    } catch (error) {
      console.error('Error getting next policy number:', error);
      throw error;
    }
  }

  /**
   * Parse policy number to extract components
   */
  static parsePolicyNumber(policyNumber) {
    try {
      const parts = policyNumber.split('-');
      if (parts.length !== 4) {
        throw new Error('Invalid policy number format');
      }

      return {
        companyPrefix: parts[0],
        policyType: parts[1],
        year: parseInt(parts[2]),
        sequenceNumber: parseInt(parts[3])
      };
    } catch (error) {
      console.error('Error parsing policy number:', error);
      throw error;
    }
  }

  /**
   * Validate policy number format
   */
  static validatePolicyNumber(policyNumber) {
    try {
      const parsed = this.parsePolicyNumber(policyNumber);
      
      // Validate year (should be reasonable range)
      const currentYear = new Date().getFullYear();
      if (parsed.year < 2000 || parsed.year > currentYear + 10) {
        return false;
      }
      
      // Validate sequence number (should be positive)
      if (parsed.sequenceNumber <= 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if policy number is unique
   */
  static async isPolicyNumberUnique(policyNumber) {
    try {
      const existingPolicy = await Policy.findOne({
        where: {
          policy_number: policyNumber
        }
      });
      
      return !existingPolicy;
    } catch (error) {
      console.error('Error checking policy number uniqueness:', error);
      throw error;
    }
  }

  /**
   * Generate policy number and ensure uniqueness
   */
  static async generateUniquePolicyNumber(companyId, policyType, year = null, maxAttempts = 10) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const policyData = await this.generatePolicyNumber(companyId, policyType, year);
        
        // Check if the generated number is unique
        const isUnique = await this.isPolicyNumberUnique(policyData.policyNumber);
        
        if (isUnique) {
          return policyData;
        }
        
        // If not unique, increment the sequence number and try again
        attempts++;
        year = year || new Date().getFullYear();
        
        // Manually increment the sequence number for next attempt
        const nextNumber = await this.getNextPolicyNumber(companyId, policyType, year);
        const incrementedNumber = nextNumber + attempts;
        
        const policyNumber = `${policyData.companyPrefix}-${policyData.policyType}-${year}-${incrementedNumber.toString().padStart(3, '0')}`;
        
        const isUniqueRetry = await this.isPolicyNumberUnique(policyNumber);
        if (isUniqueRetry) {
          return {
            policyNumber,
            companyPrefix: policyData.companyPrefix,
            policyType: policyData.policyType,
            year: year,
            sequenceNumber: incrementedNumber
          };
        }
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
        attempts++;
      }
    }
    
    throw new Error(`Failed to generate unique policy number after ${maxAttempts} attempts`);
  }

  /**
   * Get policy statistics for a company
   */
  static async getPolicyStats(companyId, year = null) {
    try {
      const currentYear = year || new Date().getFullYear();
      
      const stats = await Policy.findAll({
        where: {
          company_id: companyId,
          policy_year: currentYear
        },
        attributes: [
          'policy_type',
          [Policy.sequelize.fn('COUNT', Policy.sequelize.col('id')), 'count'],
          [Policy.sequelize.fn('MAX', Policy.sequelize.col('policy_counter')), 'maxCounter']
        ],
        group: ['policy_type']
      });

      const result = {
        year: currentYear,
        totalPolicies: 0,
        byType: {}
      };

      stats.forEach(stat => {
        const count = parseInt(stat.dataValues.count);
        const maxCounter = parseInt(stat.dataValues.maxCounter) || 0;
        
        result.totalPolicies += count;
        result.byType[stat.policy_type] = {
          count: count,
          lastSequenceNumber: maxCounter,
          nextSequenceNumber: maxCounter + 1
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting policy stats:', error);
      throw error;
    }
  }

  /**
   * Reset policy counter for a company and year (admin function)
   */
  static async resetPolicyCounter(companyId, policyType, year) {
    try {
      // Update all policies of this type and year to have counter = 0
      await Policy.update(
        { policy_counter: 0 },
        {
          where: {
            company_id: companyId,
            policy_type: policyType,
            policy_year: year
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error resetting policy counter:', error);
      throw error;
    }
  }

  /**
   * Get next available policy numbers for all policy types
   */
  static async getNextPolicyNumbers(companyId, year = null) {
    try {
      const currentYear = year || new Date().getFullYear();
      const policyTypes = ['auto', 'health', 'property', 'life', 'travel'];
      
      const nextNumbers = {};
      
      for (const policyType of policyTypes) {
        try {
          const policyData = await this.generatePolicyNumber(companyId, policyType, currentYear);
          nextNumbers[policyType] = {
            policyNumber: policyData.policyNumber,
            sequenceNumber: policyData.sequenceNumber
          };
        } catch (error) {
          console.error(`Error generating policy number for ${policyType}:`, error);
          nextNumbers[policyType] = {
            error: error.message
          };
        }
      }
      
      return {
        year: currentYear,
        nextNumbers
      };
    } catch (error) {
      console.error('Error getting next policy numbers:', error);
      throw error;
    }
  }
}

module.exports = PolicyNumberService;
