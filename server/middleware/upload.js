const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { AuditLog } = require('../models');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// Initialize upload directory
ensureUploadDir();

// File type validation
const allowedFileTypes = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar'
};

// File size limits (in bytes)
const fileSizeLimits = {
  'image/jpeg': 5 * 1024 * 1024, // 5MB
  'image/jpg': 5 * 1024 * 1024, // 5MB
  'image/png': 5 * 1024 * 1024, // 5MB
  'image/gif': 5 * 1024 * 1024, // 5MB
  'image/webp': 5 * 1024 * 1024, // 5MB
  'application/pdf': 10 * 1024 * 1024, // 10MB
  'application/msword': 5 * 1024 * 1024, // 5MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 5 * 1024 * 1024, // 5MB
  'text/plain': 1 * 1024 * 1024, // 1MB
  'application/zip': 20 * 1024 * 1024, // 20MB
  'application/x-rar-compressed': 20 * 1024 * 1024 // 20MB
};

// Generate unique filename
const generateUniqueFilename = (originalName, mimeType) => {
  const ext = allowedFileTypes[mimeType] || path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    
    // Create subdirectory based on file type
    const subDir = file.mimetype.startsWith('image/') ? 'images' : 'documents';
    const fullPath = path.join(uploadDir, subDir);
    
    try {
      await fs.access(fullPath);
    } catch (error) {
      await fs.mkdir(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname, file.mimetype);
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  if (allowedFileTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size
    files: 5 // Maximum 5 files per request
  }
});

// Upload middleware
const uploadMiddleware = (fieldName = 'file', maxCount = 1) => {
  return (req, res, next) => {
    const uploadHandler = upload.array(fieldName, maxCount);
    
    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'File too large',
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum allowed limit (20MB)'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: 'Too many files',
            code: 'TOO_MANY_FILES',
            message: 'Maximum 5 files allowed per request'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: 'Unexpected file field',
            code: 'UNEXPECTED_FILE',
            message: 'Unexpected file field in request'
          });
        }
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          code: 'UPLOAD_ERROR',
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: 'File validation error',
          code: 'FILE_VALIDATION_ERROR',
          message: err.message
        });
      }
      
      // Validate file sizes after upload
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const maxSize = fileSizeLimits[file.mimetype];
          if (maxSize && file.size > maxSize) {
            // Delete uploaded file
            fs.unlink(file.path).catch(console.error);
            return res.status(413).json({
              success: false,
              error: 'File too large',
              code: 'FILE_TOO_LARGE',
              message: `File ${file.originalname} exceeds maximum size for ${file.mimetype}`
            });
          }
        }
      }
      
      next();
    });
  };
};

// Single file upload middleware
const uploadSingle = (fieldName = 'file') => {
  return uploadMiddleware(fieldName, 1);
};

// Multiple files upload middleware
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return uploadMiddleware(fieldName, maxCount);
};

// File validation middleware
const validateUploadedFiles = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No files uploaded',
      code: 'NO_FILES'
    });
  }
  
  // Validate each file
  for (const file of req.files) {
    // Check file size
    const maxSize = fileSizeLimits[file.mimetype];
    if (maxSize && file.size > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        message: `File ${file.originalname} exceeds maximum size`
      });
    }
    
    // Check file extension
    const expectedExt = allowedFileTypes[file.mimetype];
    const actualExt = path.extname(file.originalname).toLowerCase();
    if (expectedExt && actualExt !== expectedExt) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file extension',
        code: 'INVALID_EXTENSION',
        message: `File ${file.originalname} has invalid extension`
      });
    }
  }
  
  next();
};

// File cleanup middleware
const cleanupFiles = async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;
  
  // Override send function to cleanup files on error
  res.send = function(data) {
    // If response indicates error, cleanup uploaded files
    if (res.statusCode >= 400 && req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path).catch(console.error);
      });
    }
    
    // Call original send function
    originalSend.call(this, data);
  };
  
  next();
};

// File info extraction
const extractFileInfo = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`,
    uploadedAt: new Date().toISOString()
  };
};

// Process uploaded files
const processUploadedFiles = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.uploadedFiles = req.files.map(extractFileInfo);
    
    // Log file upload to audit log
    if (req.userId) {
      AuditLog.create({
        user_id: req.userId,
        action: 'FILE_UPLOAD',
        entity_type: 'FILE',
        details: {
          files: req.uploadedFiles.map(f => ({
            originalName: f.originalName,
            filename: f.filename,
            size: f.size,
            mimetype: f.mimetype
          })),
          uploadPath: req.uploadedFiles[0]?.path
        },
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        severity: 'low',
        status: 'success'
      }).catch(error => {
        console.error('Failed to log file upload:', error);
      });
    }
  }
  
  next();
};

// Delete file utility
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get file info utility
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return {
      exists: false
    };
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  validateUploadedFiles,
  cleanupFiles,
  processUploadedFiles,
  extractFileInfo,
  deleteFile,
  getFileInfo,
  allowedFileTypes,
  fileSizeLimits,
  uploadDir
};
