const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const policyRoutes = require('./routes/policies');
const verificationRoutes = require('./routes/verifications');
const publicVerificationRoutes = require('./routes/publicVerification');
const publicClaimsRoutes = require('./routes/publicClaims');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');
const cblRoutes = require('./routes/cbl');
const insurerRoutes = require('./routes/insurer');
const insuredRoutes = require('./routes/insured');
const uploadRoutes = require('./routes/upload');
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { startDataSync } = require('./services/dataSync');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? true // Allow all origins in production (or specify your frontend domain)
      : [
          process.env.CLIENT_URL || "http://localhost:19006",
          "http://localhost:8080",
          "http://localhost:3001",
          "http://localhost:3002",
          "http://localhost:3003",
          "http://localhost:5173"
        ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration (must run before rate limiting so preflight responses get headers)
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true // Allow all origins in production (or specify your frontend domain: ["https://your-frontend-domain.com"])
    : [
        process.env.CLIENT_URL || "http://localhost:19006",
        "http://localhost:8080",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:5173" // Vite default port
      ],
  credentials: true
}));

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests, health checks, and auth endpoints
    if (req.method === 'OPTIONS') return true;
    const path = req.path || req.url || '';
    if (path === '/health' || path === '/') return true;
    // Skip rate limiting for auth endpoints (login, logout, refresh)
    if (path.includes('/auth/') || path.includes('/auth')) return true;
    // Skip rate limiting for public endpoints
    if (path.includes('/verifications/public') || path.includes('/claims/public') || path.includes('/companies/public')) return true;
    return false;
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Make io available to routes
app.set('io', io);

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    message: 'Insurance Verification & Authentication System (IVAS) API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: {
        path: '/api/auth',
        methods: ['POST', 'GET'],
        description: 'Authentication endpoints (login, refresh, logout)',
        public: false
      },
      companies: {
        path: '/api/companies',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Company management endpoints',
        public: false
      },
      policies: {
        path: '/api/policies',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Policy management endpoints',
        public: false
      },
      verifications: {
        path: '/api/verifications',
        methods: ['GET', 'POST'],
        description: 'Verification management endpoints (authenticated)',
        public: false
      },
      publicVerification: {
        path: '/api/verifications/public',
        methods: ['POST'],
        description: 'Public verification endpoint (no authentication required)',
        public: true,
        example: {
          method: 'POST',
          url: '/api/verifications/public/verify',
          body: {
            policy_number: 'POL-2024-001',
            holder_name: 'John Doe',
            verification_method: 'manual'
          }
        }
      },
      users: {
        path: '/api/users',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'User management endpoints',
        public: false
      },
      reports: {
        path: '/api/reports',
        methods: ['GET'],
        description: 'Reports and analytics endpoints',
        public: false
      },
      audit: {
        path: '/api/audit',
        methods: ['GET'],
        description: 'Audit log endpoints',
        public: false
      },
      cbl: {
        path: '/api/cbl',
        methods: ['GET', 'POST', 'PUT'],
        description: 'Central Bank of Liberia endpoints',
        public: false,
        roles: ['cbl', 'admin']
      },
      insurer: {
        path: '/api/insurer',
        methods: ['GET', 'POST', 'PUT'],
        description: 'Insurer-specific endpoints',
        public: false,
        roles: ['insurer', 'admin']
      },
      insured: {
        path: '/api/insured',
        methods: ['GET', 'POST'],
        description: 'Insured user endpoints',
        public: false,
        roles: ['insured', 'admin']
      }
    },
    health: '/health',
    documentation: 'See API documentation for details',
    support: {
      email: 'support@ivas.liberia.gov',
      documentation: 'https://docs.ivas.liberia.gov'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API base route - returns API information
app.get('/api', (req, res) => {
  res.json({
    message: 'Insurance Verification & Authentication System (IVAS) API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    baseUrl: '/api',
    endpoints: {
      auth: {
        path: '/api/auth',
        methods: ['POST', 'GET'],
        description: 'Authentication endpoints (login, refresh, logout)',
        public: false
      },
      companies: {
        path: '/api/companies',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Company management endpoints',
        public: false
      },
      publicCompanies: {
        path: '/api/companies/public',
        methods: ['GET'],
        description: 'Public companies list (no authentication required)',
        public: true
      },
      policies: {
        path: '/api/policies',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'Policy management endpoints',
        public: false
      },
      verifications: {
        path: '/api/verifications',
        methods: ['GET', 'POST'],
        description: 'Verification management endpoints (authenticated)',
        public: false
      },
      publicVerification: {
        path: '/api/verifications/public',
        methods: ['POST'],
        description: 'Public verification endpoint (no authentication required)',
        public: true
      },
      users: {
        path: '/api/users',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: 'User management endpoints',
        public: false
      },
      reports: {
        path: '/api/reports',
        methods: ['GET'],
        description: 'Reports and analytics endpoints',
        public: false
      },
      audit: {
        path: '/api/audit',
        methods: ['GET'],
        description: 'Audit log endpoints',
        public: false
      },
      cbl: {
        path: '/api/cbl',
        methods: ['GET', 'POST', 'PUT'],
        description: 'Central Bank of Liberia endpoints',
        public: false,
        roles: ['cbl', 'admin']
      },
      insurer: {
        path: '/api/insurer',
        methods: ['GET', 'POST', 'PUT'],
        description: 'Insurer-specific endpoints',
        public: false,
        roles: ['insurer', 'admin']
      },
      insured: {
        path: '/api/insured',
        methods: ['GET', 'POST'],
        description: 'Insured user endpoints',
        public: false,
        roles: ['insured', 'admin']
      }
    },
    health: '/health',
    documentation: 'See API documentation for details'
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Public companies endpoint (no auth required) - must be registered before authenticated route
const { Company } = require('./models');
const { query } = require('express-validator');
const { asyncHandler } = require('./middleware/errorHandler');

app.get('/api/companies/public', [
  query('status').optional().isIn(['approved']),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const whereClause = { status: 'approved', is_active: true };

  const companies = await Company.findAll({
    where: whereClause,
    attributes: ['id', 'name', 'license_number'],
    limit,
    order: [['name', 'ASC']]
  });

  res.json({
    companies
  });
}));

// Companies routes (authenticated)
app.use('/api/companies', authenticateToken, companyRoutes);
app.use('/api/policies', authenticateToken, policyRoutes);
// Public endpoints (no auth required) - must be before authenticated routes
app.use('/api/verifications/public', publicVerificationRoutes);
app.use('/api/claims/public', publicClaimsRoutes);
// Authenticated verification routes
app.use('/api/verifications', authenticateToken, verificationRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/audit', authenticateToken, auditRoutes);
app.use('/api/cbl', cblRoutes);
app.use('/api/insurer', insurerRoutes);
app.use('/api/insured', insuredRoutes);
// Public upload endpoint (must be before authenticated routes)
const uploadMiddleware = require('./middleware/upload');
app.post('/api/upload/image/public', 
  uploadMiddleware.uploadSingle('image'),
  uploadMiddleware.validateUploadedFiles,
  uploadMiddleware.cleanupFiles,
  uploadMiddleware.processUploadedFiles,
  require('./middleware/errorHandler').asyncHandler(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image uploaded',
        code: 'NO_IMAGE'
      });
    }

    const file = req.uploadedFiles[0];
    
    // Validate image type
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedImageTypes.includes(file.mimetype)) {
      await uploadMiddleware.deleteFile(file.path);
      return res.status(400).json({
        success: false,
        error: 'Invalid image type',
        code: 'INVALID_IMAGE_TYPE',
        message: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      url: file.url,
      path: file.url
    });
  })
);

// Authenticated upload routes
app.use('/api/upload', uploadRoutes);

// Socket.io for real-time notifications
const jwt = require('jsonwebtoken');
const { User } = require('./models');

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    // Allow connection but mark as unauthenticated
    socket.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (user && user.is_active) {
      socket.user = user;
      socket.userId = user.id;
      socket.userRole = user.role;
    } else {
      socket.user = null;
    }
  } catch (error) {
    socket.user = null;
  }
  
  next();
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Automatically join role-based rooms for authenticated users
  if (socket.user) {
    // Join role-specific room
    if (socket.userRole === 'admin') {
      socket.join('admin');
      console.log(`Admin ${socket.user.username} (${socket.id}) joined admin room`);
    } else if (socket.userRole === 'insurer') {
      socket.join('insurer');
      console.log(`Insurer ${socket.user.username} (${socket.id}) joined insurer room`);
    }
    
    // Join user-specific room for personal notifications
    socket.join(`user:${socket.userId}`);
  }
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 3003;

// Database connection and server startup
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database models
    await sequelize.sync({ force: false });
    console.log('Database models synchronized.');
    
    // Start data sync service
    startDataSync();
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await sequelize.close();
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();

module.exports = { app, server, io };
