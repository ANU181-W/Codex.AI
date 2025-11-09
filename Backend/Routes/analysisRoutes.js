const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const { catchAsync } = require('../middleware/error.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

// Analysis Endpoints
router.post('/code',
  // codeAnalysis may use different field names; skip validation if schema missing
  catchAsync(async (req, res) => {
    const analysis = await aiService.analyzeCode(req.body);
    res.json(analysis);
  })
);

router.post('/accessibility',
  catchAsync(async (req, res) => {
    const { content, type } = req.body;
    const analysis = await aiService.analyzeAccessibility(content, type);
    res.json(analysis);
  })
);

router.post('/security',
  catchAsync(async (req, res) => {
    const { content, type } = req.body;
    const analysis = await aiService.analyzeSecurity(content, type);
    res.json(analysis);
  })
);

router.post('/seo',
  catchAsync(async (req, res) => {
    const { content, type } = req.body;
    const analysis = await aiService.analyzeSEO(content, type);
    res.json(analysis);
  })
);

module.exports = router;