const express = require('express');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Loyalty = require('../models/Loyalty');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Create booking (customers only)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { serviceId, bookingDate, notes } = req.body;

    if (!serviceId || !bookingDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check for double booking
    const existingBooking = await Booking.findOne({
      serviceId,
      bookingDate: new Date(bookingDate),
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingBooking) {
      return res.status(409).json({ success: false, message: 'Service already booked for this date' });
    }

    const booking = new Booking({
      customerId: req.user.id,
      serviceId,
      bookingDate: new Date(bookingDate),
      totalPrice: service.price,
      notes,
    });

    await booking.save();
    await booking.populate('serviceId');

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

// Get user bookings
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.id })
      .populate('serviceId')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
});

// Get all bookings (admin only)
router.get('/admin/all', adminMiddleware, async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('serviceId')
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
});

// Update booking status (admin only)
router.put('/:id', adminMiddleware, async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;

    const booking = await Booking.findById(req.params.id).populate('serviceId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldStatus = booking.status;
    booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();
    await booking.populate('serviceId');

    // Award loyalty points if booking is completed
    if (status === 'completed' && oldStatus !== 'completed') {
      try {
        let loyalty = await Loyalty.findOne({ userId: booking.customerId });
        if (!loyalty) {
          loyalty = new Loyalty({ userId: booking.customerId });
        }

        const pointsEarned = loyalty.addPoints(booking.totalPrice);
        await loyalty.save();

        // Check for tier-based rewards
        const tierBenefits = Loyalty.getTierBenefits(loyalty.tier);
        if (loyalty.bookingsCount % 10 === 0 && loyalty.tier === 'gold') {
          loyalty.addReward('free_service', 'free_booking', 'Free service for reaching 10 bookings as Gold member');
        } else if (loyalty.bookingsCount % 5 === 0 && loyalty.tier === 'platinum') {
          loyalty.addReward('free_service', 'free_booking', 'Free service for reaching 5 bookings as Platinum member');
        }

        await loyalty.save();
      } catch (loyaltyError) {
        console.error('Loyalty points error:', loyaltyError);
        // Don't fail the booking update if loyalty fails
      }
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

// Cancel booking
router.put('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
