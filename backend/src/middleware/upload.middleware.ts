import multer from 'multer';

// 500KB for Development, 1MB for Production
const MAX_FILE_SIZE = process.env.NODE_ENV === 'production' 
  ? 1 * 1024 * 1024 
  : 500 * 1024;

export const uploadPDF = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
}).single('file'); // Matches the form-data key "file" in your Swagger docs