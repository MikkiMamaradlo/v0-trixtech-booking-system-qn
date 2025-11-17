const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewards: [{
      type: {
        type: String,
        enum: ['discount', 'free_service', 'priority_booking'],
        required: true,
      },
      value: {
        type: mongoose.Schema.Types.Mixed, // Can be percentage, service ID, etc.
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      expiresAt: {
        type: Date,
      },
      isUsed: {
        type: Boolean,
        default: false,
      },
      usedAt: {
        type: Date,
      },
    }],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Calculate tier based on total spent
loyaltySchema.methods.calculateTier = function() {
  const spent = this.totalSpent;
  if (spent >= 50000) return 'platinum'; // ₱50,000+
  if (spent >= 25000) return 'gold';     // ₱25,000+
  if (spent >= 10000) return 'silver';   // ₱10,000+
  return 'bronze';                       // Default
};

// Add points for booking
loyaltySchema.methods.addPoints = function(amount) {
  // 1 point per ₱100 spent
  const pointsEarned = Math.floor(amount / 100);
  this.points += pointsEarned;
  this.totalSpent += amount;
  this.bookingsCount += 1;
  this.tier = this.calculateTier();
  this.lastActivity = new Date();
  return pointsEarned;
};

// Use points for rewards
loyaltySchema.methods.usePoints = function(pointsRequired) {
  if (this.points >= pointsRequired) {
    this.points -= pointsRequired;
    return true;
  }
  return false;
};

// Add reward
loyaltySchema.methods.addReward = function(type, value, description, expiresInDays = 30) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  this.rewards.push({
    type,
    value,
    description,
    expiresAt,
  });
};

// Get available rewards
loyaltySchema.methods.getAvailableRewards = function() {
  return this.rewards.filter(reward =>
    !reward.isUsed &&
    (!reward.expiresAt || reward.expiresAt > new Date())
  );
};

// Static method to get tier benefits
loyaltySchema.statics.getTierBenefits = function(tier) {
  const benefits = {
    bronze: {
      name: 'Bronze',
      pointsMultiplier: 1,
      benefits: ['Basic loyalty program access']
    },
    silver: {
      name: 'Silver',
      pointsMultiplier: 1.25,
      benefits: ['5% discount on all services', 'Priority customer support']
    },
    gold: {
      name: 'Gold',
      pointsMultiplier: 1.5,
      benefits: ['10% discount on all services', 'Free service every 10 bookings', 'VIP customer support']
    },
    platinum: {
      name: 'Platinum',
      pointsMultiplier: 2,
      benefits: ['15% discount on all services', 'Free service every 5 bookings', 'Dedicated account manager', 'Exclusive event invites']
    }
  };
  return benefits[tier] || benefits.bronze;
};

module.exports = mongoose.model('Loyalty', loyaltySchema);