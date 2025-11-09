const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept all files for now - we'll validate type in the controller
    cb(null, true);
  }
});
const fileController = require('../Controller/fileController');
const { catchAsync } = require('../middleware/error.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

// File Management Endpoints
router.post('/upload/:id', 
  validate({ params: schemas.projectId }), 
  upload.array('index', 200), // Changed to 'index' to match your form-data
  (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    next();
  },
  catchAsync(fileController.uploadFiles)
);

router.get('/project/:projectId', 
  validate({ params: schemas.projectIdAlt }), 
  catchAsync(fileController.getFiles)
);

router.get('/:id', 
  validate({ params: schemas.fileId }), 
  catchAsync(fileController.getFileById)
);

router.delete('/:id', 
  validate({ params: schemas.fileId }), 
  catchAsync(fileController.deleteFile)
);

module.exports = router;