const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const randomName = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${timestamp}-${randomName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Strict file type validation
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  // Check both MIME type and extension
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Invalid MIME type. File type not allowed.'));
  }
  
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Invalid file extension.'));
  }

  // Additional security: Block potentially dangerous files
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs', '.jar', '.com', '.pif', '.php', '.asp'];
  if (dangerousExtensions.includes(fileExtension)) {
    return cb(new Error('Executable files are not allowed.'));
  }

  // Check for null bytes in filename (security measure)
  if (file.originalname.includes('\0')) {
    return cb(new Error('Invalid filename.'));
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10, // Maximum 10 files per request
    fields: 20, // Maximum 20 non-file fields
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024 // Maximum field value size (1MB)
  },
  fileFilter: fileFilter
});

module.exports = upload;