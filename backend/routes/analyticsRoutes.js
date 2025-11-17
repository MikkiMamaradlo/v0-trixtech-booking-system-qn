const express = require('express');
const { getAnalytics, getRevenueTrends, getServicePopularity, getCustomerInsights } = require('../utils/analyticsService');
const { authMiddleware: auth, adminMiddleware: isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get analytics summary (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await getAnalytics(start, end);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get revenue trends (admin only)
router.get('/revenue-trends', auth, isAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trends = await getRevenueTrends(days);
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get service popularity (admin only)
router.get('/service-popularity', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const popularity = await getServicePopularity(start, end);
    res.json({ success: true, data: popularity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get customer insights (admin only)
router.get('/customer-insights', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const insights = await getCustomerInsights(start, end);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
