const express = require('express');
const router = express.Router();

// Import all route modules
const projectRoutes = require('./projectRoutes');
const fileRoutes = require('./fileRoutes');
const scanRoutes = require('./scanRoutes');
const analysisRoutes = require('./analysisRoutes');
const debugRoutes = require('./debugRoutes');

// Register routes
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);
router.use('/scans', scanRoutes);
router.use('/analysis', analysisRoutes);
router.use('/debug', debugRoutes);

module.exports = router;