// middleware/upload.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadDirectory = path.join(__dirname, '..', 'uploaded_file_list');

const ALLOWED_TYPES = [
  'application/pdf',                                                         // .pdf
  'application/msword',                                                      // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain'                                                               // .txt
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  ALLOWED_TYPES.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, TXT'), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB upload limit
});
