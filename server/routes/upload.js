const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  uploadSingle, 
  uploadMultiple, 
  validateUploadedFiles, 
  cleanupFiles, 
  processUploadedFiles,
  deleteFile,
  getFileInfo,
  uploadDir
} = require('../middleware/upload');

const router = express.Router();

// Public image upload endpoint (for public claims)
router.post('/image/public',
  uploadSingle('image'),
  validateUploadedFiles,
  cleanupFiles,
  processUploadedFiles,
  asyncHandler(async (req, res) => {
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
      await deleteFile(file.path);
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

// Apply authentication to all other upload routes
router.use(authenticateToken);

/**
 * @route POST /api/upload/single
 * @desc Upload a single file
 * @access Authenticated users
 */
router.post('/single', 
  uploadSingle('file'),
  validateUploadedFiles,
  cleanupFiles,
  processUploadedFiles,
  asyncHandler(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const file = req.uploadedFiles[0];

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: file.filename,
        originalName: file.originalName,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: file.url,
        uploadedAt: file.uploadedAt
      }
    });
  })
);

/**
 * @route POST /api/upload/multiple
 * @desc Upload multiple files
 * @access Authenticated users
 */
router.post('/multiple', 
  uploadMultiple('files', 5),
  validateUploadedFiles,
  cleanupFiles,
  processUploadedFiles,
  asyncHandler(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
        code: 'NO_FILES'
      });
    }

    const files = req.uploadedFiles.map(file => ({
      id: file.filename,
      originalName: file.originalName,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: file.url,
      uploadedAt: file.uploadedAt
    }));

    res.status(201).json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      files: files
    });
  })
);

/**
 * @route POST /api/upload/document
 * @desc Upload document files (PDF, DOC, DOCX, TXT)
 * @access Authenticated users
 */
router.post('/document',
  uploadSingle('document'),
  validateUploadedFiles,
  cleanupFiles,
  processUploadedFiles,
  asyncHandler(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No document uploaded',
        code: 'NO_DOCUMENT'
      });
    }

    const file = req.uploadedFiles[0];
    
    // Validate document type
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedDocTypes.includes(file.mimetype)) {
      await deleteFile(file.path);
      return res.status(400).json({
        success: false,
        error: 'Invalid document type',
        code: 'INVALID_DOCUMENT_TYPE',
        message: 'Only PDF, DOC, DOCX, and TXT files are allowed'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: file.filename,
        originalName: file.originalName,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: file.url,
        uploadedAt: file.uploadedAt
      }
    });
  })
);

/**
 * @route POST /api/upload/image
 * @desc Upload image files (JPEG, PNG, GIF, WebP)
 * @access Authenticated users
 */
router.post('/image',
  uploadSingle('image'),
  validateUploadedFiles,
  cleanupFiles,
  processUploadedFiles,
  asyncHandler(async (req, res) => {
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
      await deleteFile(file.path);
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
      image: {
        id: file.filename,
        originalName: file.originalName,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: file.url,
        uploadedAt: file.uploadedAt
      }
    });
  })
);

/**
 * @route GET /api/upload/file/:filename
 * @desc Get file information
 * @access Authenticated users
 */
router.get('/file/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  // Security check: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid filename',
      code: 'INVALID_FILENAME'
    });
  }

  // Look for file in both images and documents directories
  const imagePath = path.join(uploadDir, 'images', filename);
  const documentPath = path.join(uploadDir, 'documents', filename);
  
  let filePath = null;
  let fileInfo = null;

  // Check images directory first
  fileInfo = await getFileInfo(imagePath);
  if (fileInfo.exists) {
    filePath = imagePath;
  } else {
    // Check documents directory
    fileInfo = await getFileInfo(documentPath);
    if (fileInfo.exists) {
      filePath = documentPath;
    }
  }

  if (!filePath || !fileInfo.exists) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
      code: 'FILE_NOT_FOUND'
    });
  }

  res.json({
    success: true,
    file: {
      filename: filename,
      size: fileInfo.size,
      created: fileInfo.created,
      modified: fileInfo.modified,
      url: `/uploads/${path.basename(path.dirname(filePath))}/${filename}`
    }
  });
}));

/**
 * @route DELETE /api/upload/file/:filename
 * @desc Delete a file
 * @access Authenticated users
 */
router.delete('/file/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  // Security check: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid filename',
      code: 'INVALID_FILENAME'
    });
  }

  // Look for file in both images and documents directories
  const imagePath = path.join(uploadDir, 'images', filename);
  const documentPath = path.join(uploadDir, 'documents', filename);
  
  let filePath = null;
  let fileInfo = null;

  // Check images directory first
  fileInfo = await getFileInfo(imagePath);
  if (fileInfo.exists) {
    filePath = imagePath;
  } else {
    // Check documents directory
    fileInfo = await getFileInfo(documentPath);
    if (fileInfo.exists) {
      filePath = documentPath;
    }
  }

  if (!filePath || !fileInfo.exists) {
    return res.status(404).json({
      success: false,
      error: 'File not found',
      code: 'FILE_NOT_FOUND'
    });
  }

  const deleted = await deleteFile(filePath);
  
  if (deleted) {
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      code: 'DELETE_FAILED'
    });
  }
}));

/**
 * @route GET /api/upload/files
 * @desc List uploaded files (with pagination)
 * @access Authenticated users
 */
router.get('/files', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type = 'all' } = req.query;
  const offset = (page - 1) * limit;

  try {
    const files = [];
    
    // Get files from images directory
    if (type === 'all' || type === 'images') {
      try {
        const imageDir = path.join(uploadDir, 'images');
        const imageFiles = await fs.readdir(imageDir);
        
        for (const filename of imageFiles) {
          const filePath = path.join(imageDir, filename);
          const fileInfo = await getFileInfo(filePath);
          
          if (fileInfo.exists) {
            files.push({
              filename: filename,
              type: 'image',
              size: fileInfo.size,
              created: fileInfo.created,
              modified: fileInfo.modified,
              url: `/uploads/images/${filename}`
            });
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
    
    // Get files from documents directory
    if (type === 'all' || type === 'documents') {
      try {
        const documentDir = path.join(uploadDir, 'documents');
        const documentFiles = await fs.readdir(documentDir);
        
        for (const filename of documentFiles) {
          const filePath = path.join(documentDir, filename);
          const fileInfo = await getFileInfo(filePath);
          
          if (fileInfo.exists) {
            files.push({
              filename: filename,
              type: 'document',
              size: fileInfo.size,
              created: fileInfo.created,
              modified: fileInfo.modified,
              url: `/uploads/documents/${filename}`
            });
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }

    // Sort by creation date (newest first)
    files.sort((a, b) => new Date(b.created) - new Date(a.created));

    // Apply pagination
    const paginatedFiles = files.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      files: paginatedFiles,
      pagination: {
        total: files.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(files.length / limit)
      }
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files',
      code: 'LIST_FAILED'
    });
  }
}));

module.exports = router;
