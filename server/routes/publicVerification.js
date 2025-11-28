const express = require('express');
const { body, validationResult } = require('express-validator');
const { Verification, Policy, Company, AuditLog } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

// Public verification endpoint (no authentication required)
router.post('/verify', [
  body('policy_number').notEmpty().trim().withMessage('Policy number is required'),
  body('company_id').isInt().withMessage('Valid company ID is required'),
  body('verification_method').optional().isIn(['scan', 'manual', 'api']).withMessage('Invalid verification method'),
  body('location').optional().trim(),
  body('latitude').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= -90 && num <= 90;
  }).withMessage('Latitude must be a valid number between -90 and 90'),
  body('longitude').optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= -180 && num <= 180;
  }).withMessage('Longitude must be a valid number between -180 and 180'),
  body('document_image').optional(),
  body('additional_notes').optional().trim()
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

  const startTime = Date.now();
  const {
    policy_number,
    company_id,
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

  // Search for matching policy by policy number and company
  const policy = await Policy.findOne({
    where: {
      policy_number: policy_number,
      company_id: company_id
    },
    include: [
      { model: Company, as: 'company', attributes: ['id', 'name', 'status'] }
    ]
  });

  let verificationResult = {
    status: 'not_found',
    reason: 'No matching policy found',
    confidence_score: 0,
    matched_policy: null
  };

  if (policy) {
    // Check if policy is expired
    const today = new Date();
    const expiryDate = new Date(policy.expiry_date);
    
    if (expiryDate < today) {
      verificationResult = {
        status: 'expired',
        reason: 'Policy has expired',
        confidence_score: 95,
        matched_policy: policy
      };
    } else {
      verificationResult = {
        status: 'valid',
        reason: 'Policy verified successfully',
        confidence_score: 100,
        matched_policy: policy
      };
    }
  } else {
    verificationResult = {
      status: 'invalid',
      reason: 'Policy not found for this insurer',
      confidence_score: 0,
      matched_policy: null
    };
  }

  // Create verification record (no officer_id for public verification)
  let verification;
  try {
    const verificationData = {
      policy_number,
      holder_name: verificationResult.matched_policy?.holder_name || policy_number, // Use policy_number as fallback if no holder_name
      expiry_date: verificationResult.matched_policy?.expiry_date || null,
      officer_id: null, // Public verification has no officer
      company_id: company_id,
      status: verificationResult.status === 'invalid' || verificationResult.status === 'not_found' ? 'fake' : verificationResult.status,
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
    
    // Only include holder_id_number if it exists in the matched policy
    if (verificationResult.matched_policy?.holder_id_number) {
      verificationData.holder_id_number = verificationResult.matched_policy.holder_id_number;
    }
    
    verification = await Verification.create(verificationData);
  } catch (createError) {
    console.error('Error creating verification:', createError);
    // If it's a duplicate error, still return the verification result
    // but don't create a new record
    if (createError.name === 'SequelizeUniqueConstraintError') {
      // Find existing verification or create a temporary one for response
      verification = {
        id: null,
        status: verificationResult.status,
        reason: verificationResult.reason,
        confidence_score: verificationResult.confidence_score,
        verified_at: new Date(),
        response_time_ms: Date.now() - startTime
      };
    } else {
      throw createError;
    }
  }

  // Log verification attempt (no user_id for public verification)
  // Only log if verification was actually created
  if (verification && verification.id) {
    try {
      await AuditLog.create({
        user_id: null,
        action: 'DOCUMENT_VERIFY_PUBLIC',
        entity_type: 'VERIFICATION',
        entity_id: verification.id,
        details: {
          policy_number,
          company_id,
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
    } catch (auditError) {
      // Log error but don't fail the verification response
      console.error('Error creating audit log:', auditError);
    }
  }

  // Send real-time notification to admin and insurer rooms
  const io = req.app.get('io');
  if (io) {
    const notificationData = {
      verification_id: verification.id,
      policy_number,
      company_id,
      company_name: company.name,
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
    
    // Special alert for fake/invalid detections
    if (verificationResult.status === 'fake' || verificationResult.status === 'invalid') {
      io.to('admin').emit('fake_detected', notificationData);
      io.to('insurer').emit('fake_detected', notificationData);
    }
  }

  res.json({
    message: 'Verification completed',
    verification: {
      id: verification?.id || null,
      status: verification?.status || verificationResult.status,
      reason: verification?.reason || verificationResult.reason,
      confidence_score: verification?.confidence_score || verificationResult.confidence_score,
      verified_at: verification?.verified_at || new Date(),
      response_time_ms: verification?.response_time_ms || (Date.now() - startTime),
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

module.exports = router;

