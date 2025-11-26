const express = require('express');
const router = express.Router();

// Health check endpoint (liveness probe)
router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Readiness check endpoint (checks dependencies)
router.get('/readyz', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    blobStorage: false,
    overall: false
  };

  const errors = [];

  // Check database (Prisma)
  try {
    const prisma = require('../utils/prisma');
    if (prisma && prisma.$queryRaw) {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    }
  } catch (error) {
    errors.push(`Database: ${error.message}`);
  }

  // Check Redis
  try {
    const redisAdapter = require('../services/cache/redis.adapter');
    checks.redis = await redisAdapter.isAvailable();
    if (!checks.redis) {
      errors.push('Redis: Not available (using fallback)');
    }
  } catch (error) {
    errors.push(`Redis: ${error.message}`);
  }

  // Check Blob Storage
  try {
    const blobService = require('../services/storage/blob.service');
    checks.blobStorage = await blobService.isAvailable();
    if (!checks.blobStorage && process.env.USE_BLOB_STORAGE === 'true') {
      errors.push('Blob Storage: Not available (configured but not accessible)');
    }
  } catch (error) {
    if (process.env.USE_BLOB_STORAGE === 'true') {
      errors.push(`Blob Storage: ${error.message}`);
    }
  }

  // Overall status (database is critical, others are optional)
  checks.overall = checks.database;

  const statusCode = checks.overall ? 200 : 503;
  
  res.status(statusCode).json({
    status: checks.overall ? 'ready' : 'not ready',
    checks,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
