const express = require('express');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { authMiddleware: auth } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ serviceId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ serviceId });
    const averageRating = await Review.aggregate([
      { $match: { serviceId: require('mongoose').Types.ObjectId(serviceId) } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: averageRating[0] || { average: 0, count: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a review (customer only, after booking completion)
router.post('/', auth, async (req, res) => {
  try {
    const { bookingId, rating, comment, images } = req.body;
    const userId = req.user.id;

    // Verify booking exists and belongs to user
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ userId, serviceId: booking.serviceId, bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Review already exists for this booking' });
    }

    const review = new Review({
      serviceId: booking.serviceId,
      userId,
      bookingId,
      rating,
      comment,
      images: images || [],
      isVerified: true // Since it's after completion
    });

    await review.save();

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a review
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: id, userId });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.images = images || review.images;

    await review.save();

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a review
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findOneAndDelete({ _id: id, userId });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark review as helpful (anyone can do this)
router.post('/:id/helpful', async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's reviews
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reviews = await Review.find({ userId })
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;