import express from 'express';
import path from 'path';
import fs from 'fs';
import { uploadSingle, uploadMultiple } from '../utils/upload';
import { protect } from '../middleware/auth';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload single image
router.post(
  '/',
  protect,
  (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File quá lớn. Tối đa 5MB', 400));
        }
        return next(new AppError(err.message || 'Lỗi upload file', 400));
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Không có file được upload', 400);
    }

    // Save file to disk
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
    const filepath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filepath, req.file.buffer);

    // Return URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${filename}`;

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        filename,
      },
    });
  })
);

// Upload multiple images
router.post(
  '/multiple',
  protect,
  (req, res, next) => {
    uploadMultiple(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File quá lớn. Tối đa 5MB', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError('Tối đa 10 file', 400));
        }
        return next(new AppError(err.message || 'Lỗi upload file', 400));
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      throw new AppError('Không có file được upload', 400);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedFiles = [];

    for (const file of files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      const filepath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filepath, file.buffer);

      uploadedFiles.push({
        url: `${baseUrl}/uploads/${filename}`,
        filename,
      });
    }

    res.status(200).json({
      success: true,
      data: uploadedFiles,
    });
  })
);

// Delete image
router.delete(
  '/:filename',
  protect,
  asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(uploadsDir, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa file',
    });
  })
);

export default router;
