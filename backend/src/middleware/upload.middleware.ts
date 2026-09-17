import multer from 'multer';

// 10MB for AI material uploads — real syllabus/learning-material PDFs
// routinely exceed the old 500KB (dev) / 1MB (prod) limits, which rejected
// essentially any legitimate document.
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

// ─── Math Upload Config (SRS 3.13) ───────────────────────────────────────────
// Accepts JPG, PNG, PDF up to 5 MB from student phone uploads
const MATH_UPLOAD_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MATH_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
]);

export const uploadMathFile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MATH_UPLOAD_MAX_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MATH_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed for math uploads'));
    }
  },
}).single('file');

// ─── Profile Avatar Upload ────────────────────────────────────────────────
// Accepts JPG, PNG, or WEBP up to 3 MB for a user's profile picture
const AVATAR_MAX_SIZE = 3 * 1024 * 1024; // 3 MB

const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: AVATAR_MAX_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WEBP images are allowed for profile photos'));
    }
  },
}).single('file');