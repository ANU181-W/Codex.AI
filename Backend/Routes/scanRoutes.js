const express = require('express');
const router = express.Router();
const scanController = require('../Controller/scanController');
const { catchAsync } = require('../middleware/error.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

// Scan Endpoints
router.post('/project/:projectId', 
  validate({ params: schemas.projectIdAlt }), 
  catchAsync(scanController.startScan)
);

router.get('/project/:projectId', 
  validate({ params: schemas.projectIdAlt }), 
  catchAsync(scanController.getScanResults)
);

router.get('/project/:projectId/latest', 
  validate({ params: schemas.projectIdAlt }), 
  catchAsync(scanController.getLatestScan)
);

module.exports = router;