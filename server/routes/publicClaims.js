const express = require('express');
const { body, validationResult } = require('express-validator');
const { Claim, Policy, Company, AuditLog } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

// Public claim submission endpoint (no authentication required)
router.post('/submit', [
  body('policy_number').notEmpty().trim().withMessage('Policy number is required'),
  body('company_id').custom((value) => {
    const num = parseInt(value);
    return !isNaN(num) && num > 0;
  }).withMessage('Valid company ID is required'),
  body('note').notEmpty().trim().withMessage('Claim note/description is required'),
  body('insurance_type').notEmpty().trim().withMessage('Insurance type is required'),
  body('attachment_url').optional().custom((value) => {
    if (!value || value === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Invalid attachment URL')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      message: errors.array()[0]?.msg || 'Invalid input',
      details: errors.array()
    });
  }

  const { policy_number, company_id, note, insurance_type, attachment_url } = req.body;

  // Verify company exists and is approved
  const company = await Company.findByPk(company_id);
  if (!company) {
    return res.status(404).json({
      error: 'Company not found',
      code: 'COMPANY_NOT_FOUND'
    });
  }

  if (company.status !== 'approved') {
    return res.status(400).json({
      error: 'Company is not approved',
      code: 'COMPANY_NOT_APPROVED'
    });
  }

  // Try to find policy by policy number
  let policy = await Policy.findOne({
    where: {
      policy_number: policy_number,
      company_id: company_id
    }
  });

  // Create claim data
  let claimData = {
    policy_id: policy ? policy.id : null,
    insurer_id: company_id,
    description: note.trim(),
    status: 'reported',
    insured_id: null, // Public claim has no insured user
    insurance_type: insurance_type,
    attachment_url: attachment_url || null
  };

  // Create claim
  let claim;
  try {
    claim = await Claim.create(claimData);
  } catch (createError) {
    console.error('Error creating claim:', createError);
    return res.status(500).json({
      error: 'Failed to create claim',
      code: 'CLAIM_CREATION_ERROR',
      message: createError.message
    });
  }

  // Log claim submission (no user_id for public claim)
  try {
    await AuditLog.create({
      user_id: null,
      action: 'CLAIM_SUBMIT_PUBLIC',
      entity_type: 'CLAIM',
      entity_id: claim.id,
      details: {
        policy_id: policy ? policy.id : null,
        policy_number: policy_number,
        company_id,
        company_name: company.name,
        description: note.substring(0, 200), // Truncate for logging
        insurance_type,
        attachment_url,
        is_public: true
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      severity: 'medium',
      status: 'success'
    });
  } catch (auditError) {
    console.error('Error creating audit log:', auditError);
    // Don't fail the claim submission if audit log fails
  }

  // Send real-time notification to insurer room
  const io = req.app.get('io');
  if (io) {
    const notificationData = {
      claim_id: claim.id,
      policy_id: policy ? policy.id : null,
      policy_number: policy_number,
      company_id,
      company_name: company.name,
      description: note.substring(0, 100),
      insurance_type,
      status: 'reported',
      timestamp: new Date(),
      is_public: true
    };

    io.to('insurer').emit('new_claim', notificationData);
    io.to(`company:${company_id}`).emit('new_claim', notificationData);
    io.emit('claim_update', notificationData);
  }

  res.status(201).json({
    message: 'Claim submitted successfully',
    claim: {
      id: claim.id,
      policy_id: policy ? policy.id : null,
      policy_number: policy_number,
      company_name: company.name,
      description: claim.description,
      insurance_type: claim.insurance_type,
      status: claim.status,
      created_at: claim.created_at
    },
    note: policy ? null : 'Policy not found - claim submitted for manual review'
  });
}));

module.exports = router;

