const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    isVerified: {
      type: Boolean,
      default: false, // Verified if user actually used the service
    },
    helpful: {
      type: Number,
      default: 0,
    },
    images: [{
      type: String, // URLs to review images
    }],
  },
  { timestamps: true }
);

// Compound index to ensure one review per user per service per booking
reviewSchema.index({ userId: 1, serviceId: 1, bookingId: 1 }, { unique: true });

// Virtual for average rating calculation
reviewSchema.statics.getAverageRating = async function(serviceId) {
  const result = await this.aggregate([
    { $match: { serviceId: new mongoose.Types.ObjectId(serviceId) } },
    {
      $group: {
        _id: '$serviceId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  return result[0] || { averageRating: 0, totalReviews: 0 };
};

module.exports = mongoose.model('Review', reviewSchema);