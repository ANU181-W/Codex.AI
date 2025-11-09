const express = require('express');
const router = express.Router();

let prisma = null;
try {
  prisma = require('../utils/prisma');
} catch (e) {
  // prisma not available
}

// GET /api/debug/ai-usage?limit=20
router.get('/ai-usage', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    if (!prisma || !prisma.aiUsage) {
      return res.status(501).json({ error: 'Prisma/AIUsage not available' });
    }
    const rows = await prisma.aiUsage.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch ai_usage:', err);
    res.status(500).json({ error: 'Failed to fetch ai_usage' });
  }
});

module.exports = router;
