const express = require('express');
const Loyalty = require('../models/Loyalty');
const Booking = require('../models/Booking');
const { authMiddleware: auth, adminMiddleware: isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user's loyalty status
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    let loyalty = await Loyalty.findOne({ userId });

    if (!loyalty) {
      // Create loyalty record if it doesn't exist
      loyalty = new Loyalty({ userId });
      await loyalty.save();
    }

    const tierBenefits = Loyalty.getTierBenefits(loyalty.tier);
    const availableRewards = loyalty.getAvailableRewards();

    res.json({
      success: true,
      data: {
        ...loyalty.toObject(),
        tierBenefits,
        availableRewards,
        nextTierThreshold: getNextTierThreshold(loyalty.totalSpent)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all loyalty programs (admin)
router.get('/all', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, tier } = req.query;

    let filter = {};
    if (tier) filter.tier = tier;

    const loyaltyPrograms = await Loyalty.find(filter)
      .populate('userId', 'name email')
      .sort({ totalSpent: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Loyalty.countDocuments(filter);

    res.json({
      success: true,
      data: loyaltyPrograms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Redeem points for reward
router.post('/redeem', auth, async (req, res) => {
  try {
    const { rewardType, pointsRequired } = req.body;
    const userId = req.user.id;

    const loyalty = await Loyalty.findOne({ userId });
    if (!loyalty) {
      return res.status(404).json({ success: false, message: 'Loyalty program not found' });
    }

    if (!loyalty.usePoints(pointsRequired)) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }

    // Add reward based on type
    let rewardDescription = '';
    let rewardValue = null;

    switch (rewardType) {
      case 'discount_10':
        rewardDescription = '10% discount on next service';
        rewardValue = 10; // percentage
        break;
      case 'discount_20':
        rewardDescription = '20% discount on next service';
        rewardValue = 20;
        break;
      case 'free_service':
        rewardDescription = 'Free service booking';
        rewardValue = 'free_booking';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid reward type' });
    }

    loyalty.addReward('discount', rewardValue, rewardDescription);
    await loyalty.save();

    res.json({
      success: true,
      message: 'Reward redeemed successfully',
      data: loyalty
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Use reward
router.post('/use-reward/:rewardId', auth, async (req, res) => {
  try {
    const { rewardId } = req.params;
    const userId = req.user.id;

    const loyalty = await Loyalty.findOne({ userId });
    if (!loyalty) {
      return res.status(404).json({ success: false, message: 'Loyalty program not found' });
    }

    const reward = loyalty.rewards.id(rewardId);
    if (!reward || reward.isUsed) {
      return res.status(404).json({ success: false, message: 'Reward not found or already used' });
    }

    if (reward.expiresAt && reward.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Reward has expired' });
    }

    reward.isUsed = true;
    reward.usedAt = new Date();
    await loyalty.save();

    res.json({
      success: true,
      message: 'Reward used successfully',
      data: { reward, loyalty }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Add points to user
router.post('/admin/add-points', auth, isAdmin, async (req, res) => {
  try {
    const { userId, points, reason } = req.body;

    let loyalty = await Loyalty.findOne({ userId });
    if (!loyalty) {
      loyalty = new Loyalty({ userId });
    }

    loyalty.points += points;
    loyalty.tier = loyalty.calculateTier();

    // Log the manual points addition
    loyalty.rewards.push({
      type: 'manual',
      value: points,
      description: `Manual points addition: ${reason || 'Admin adjustment'}`,
    });

    await loyalty.save();

    res.json({
      success: true,
      message: 'Points added successfully',
      data: loyalty
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get tier benefits (public)
router.get('/tiers', (req, res) => {
  try {
    const tiers = {
      bronze: Loyalty.getTierBenefits('bronze'),
      silver: Loyalty.getTierBenefits('silver'),
      gold: Loyalty.getTierBenefits('gold'),
      platinum: Loyalty.getTierBenefits('platinum'),
    };

    res.json({ success: true, data: tiers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to get next tier threshold
function getNextTierThreshold(currentSpent) {
  if (currentSpent < 10000) return { tier: 'silver', amount: 10000, remaining: 10000 - currentSpent };
  if (currentSpent < 25000) return { tier: 'gold', amount: 25000, remaining: 25000 - currentSpent };
  if (currentSpent < 50000) return { tier: 'platinum', amount: 50000, remaining: 50000 - currentSpent };
  return { tier: 'max', amount: null, remaining: 0 };
}

module.exports = router;