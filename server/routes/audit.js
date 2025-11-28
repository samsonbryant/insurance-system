const express = require('express');
const { query, validationResult } = require('express-validator');
const { AuditLog, User } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

const router = express.Router();

// Get audit logs with filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('user_id').optional().isInt(),
  query('action').optional().isLength({ min: 1 }),
  query('entity_type').optional().isLength({ min: 1 }),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('status').optional().isIn(['success', 'failed', 'warning']),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const { 
    user_id, 
    action, 
    entity_type, 
    severity, 
    status, 
    date_from, 
    date_to 
  } = req.query;

  const whereClause = {};

  // Non-admin users can only see their own audit logs
  if (req.userRole !== 'admin') {
    whereClause.user_id = req.userId;
  } else if (user_id) {
    whereClause.user_id = user_id;
  }

  if (action) whereClause.action = { [Op.like]: `%${action}%` };
  if (entity_type) whereClause.entity_type = entity_type;
  if (severity) whereClause.severity = severity;
  if (status) whereClause.status = status;

  if (date_from || date_to) {
    whereClause.created_at = {};
    if (date_from) whereClause.created_at[Op.gte] = date_from;
    if (date_to) whereClause.created_at[Op.lte] = date_to;
  }

  const { count, rows: auditLogs } = await AuditLog.findAndCountAll({
    where: whereClause,
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'first_name', 'last_name'] }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  res.json({
    audit_logs: auditLogs,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Get audit log by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const auditLog = await AuditLog.findByPk(req.params.id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'first_name', 'last_name'] }
    ]
  });

  if (!auditLog) {
    return res.status(404).json({
      error: 'Audit log not found',
      code: 'AUDIT_LOG_NOT_FOUND'
    });
  }

  // Non-admin users can only see their own audit logs
  if (req.userRole !== 'admin' && req.userId !== auditLog.user_id) {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }

  res.json({ audit_log: auditLog });
}));

// Get audit statistics (Admin only)
router.get('/stats/summary', requireAdmin, asyncHandler(async (req, res) => {
  const { date_from, date_to } = req.query;
  
  const whereClause = {};
  if (date_from || date_to) {
    whereClause.created_at = {};
    if (date_from) whereClause.created_at[Op.gte] = date_from;
    if (date_to) whereClause.created_at[Op.lte] = date_to;
  }

  const [
    totalLogs,
    severityCounts,
    statusCounts,
    actionCounts,
    recentLogs
  ] = await Promise.all([
    AuditLog.count({ where: whereClause }),
    AuditLog.findAll({
      attributes: [
        'severity',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['severity']
    }),
    AuditLog.findAll({
      attributes: [
        'status',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['status']
    }),
    AuditLog.findAll({
      attributes: [
        'action',
        [AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['action'],
      order: [[AuditLog.sequelize.fn('COUNT', AuditLog.sequelize.col('id')), 'DESC']],
      limit: 10
    }),
    AuditLog.count({
      where: {
        ...whereClause,
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
  ]);

  const stats = {
    total_logs: totalLogs,
    recent_logs_24h: recentLogs,
    severity_breakdown: severityCounts.reduce((acc, item) => {
      acc[item.severity] = parseInt(item.dataValues.count);
      return acc;
    }, {}),
    status_breakdown: statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.dataValues.count);
      return acc;
    }, {}),
    top_actions: actionCounts.map(item => ({
      action: item.action,
      count: parseInt(item.dataValues.count)
    }))
  };

  res.json({ stats });
}));

// Export audit logs (Admin only)
router.get('/export/csv', requireAdmin, [
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('action').optional().isLength({ min: 1 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { date_from, date_to, severity, action } = req.query;

  const whereClause = {};
  if (severity) whereClause.severity = severity;
  if (action) whereClause.action = { [Op.like]: `%${action}%` };

  if (date_from || date_to) {
    whereClause.created_at = {};
    if (date_from) whereClause.created_at[Op.gte] = date_from;
    if (date_to) whereClause.created_at[Op.lte] = date_to;
  }

  const auditLogs = await AuditLog.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'first_name', 'last_name'] }
    ],
    order: [['created_at', 'DESC']],
    limit: 10000 // Limit for performance
  });

  const csvData = generateAuditCSV(auditLogs);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
  res.send(csvData);
}));

// Helper function to generate audit CSV
function generateAuditCSV(auditLogs) {
  const headers = [
    'ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 
    'Severity', 'Status', 'IP Address', 'User Agent', 'Error Message'
  ];
  
  const rows = auditLogs.map(log => [
    log.id,
    log.created_at,
    log.user ? `${log.user.first_name} ${log.user.last_name} (${log.user.username})` : '',
    log.action,
    log.entity_type || '',
    log.entity_id || '',
    log.severity,
    log.status,
    log.ip_address || '',
    log.user_agent || '',
    log.error_message || ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

module.exports = router;
