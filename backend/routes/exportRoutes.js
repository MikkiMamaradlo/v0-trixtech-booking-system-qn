const express = require('express');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { authMiddleware: auth, adminMiddleware: isAdmin } = require('../middleware/auth');

const router = express.Router();

// Export services to CSV
router.get('/services/csv', auth, isAdmin, async (req, res) => {
  try {
    const services = await Service.find({}).sort({ createdAt: -1 });

    const fields = [
      '_id',
      'name',
      'description',
      'category',
      'price',
      'duration',
      'isAvailable',
      'createdAt',
      'updatedAt'
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(services);

    res.header('Content-Type', 'text/csv');
    res.attachment('services.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export bookings to CSV
router.get('/bookings/csv', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email')
      .populate('serviceId', 'name price')
      .sort({ createdAt: -1 });

    const csvData = bookings.map(booking => ({
      id: booking._id,
      customerName: booking.userId?.name || 'N/A',
      customerEmail: booking.userId?.email || 'N/A',
      serviceName: booking.serviceId?.name || 'N/A',
      servicePrice: booking.serviceId?.price || 0,
      bookingDate: booking.bookingDate,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice,
      notes: booking.notes || '',
      createdAt: booking.createdAt
    }));

    const fields = [
      'id',
      'customerName',
      'customerEmail',
      'serviceName',
      'servicePrice',
      'bookingDate',
      'status',
      'paymentStatus',
      'totalPrice',
      'notes',
      'createdAt'
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('bookings.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export users to CSV
router.get('/users/csv', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    const fields = [
      '_id',
      'name',
      'email',
      'role',
      'createdAt',
      'updatedAt'
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(users);

    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export analytics report to PDF
router.get('/analytics/pdf', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get analytics data
    const analytics = await Analytics.find({
      date: { $gte: start, $lte: end },
    });

    const summary = {
      totalBookings: analytics.filter(a => a.type === 'booking_created').length,
      totalCancellations: analytics.filter(a => a.type === 'booking_cancelled').length,
      totalRevenue: analytics
        .filter(a => a.type === 'payment_received')
        .reduce((sum, a) => sum + (a.amount || 0), 0),
      newUsers: analytics.filter(a => a.type === 'user_signup').length,
    };

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.pdf');

    doc.pipe(res);

    // Title
    doc.fontSize(20).text('TRIXTECH Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Period: ${start.toDateString()} - ${end.toDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Bookings: ${summary.totalBookings}`);
    doc.text(`Total Cancellations: ${summary.totalCancellations}`);
    doc.text(`Total Revenue: ₱${summary.totalRevenue.toFixed(2)}`);
    doc.text(`New Users: ${summary.newUsers}`);
    doc.moveDown(2);

    // Service Popularity
    const serviceBookings = analytics.filter(a => a.type === 'booking_created' && a.details?.serviceName);
    const serviceStats = serviceBookings.reduce((acc, booking) => {
      const serviceName = booking.details.serviceName;
      acc[serviceName] = (acc[serviceName] || 0) + 1;
      return acc;
    }, {});

    doc.fontSize(16).text('Service Popularity', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    Object.entries(serviceStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([service, count]) => {
        doc.text(`${service}: ${count} bookings`);
      });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export customer insights to CSV
router.get('/customers/csv', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await Analytics.find({
      date: { $gte: start, $lte: end },
    });

    const customerStats = analytics.reduce((acc, item) => {
      const userId = item.userId;
      if (!userId) return acc;

      if (!acc[userId]) {
        acc[userId] = {
          bookings: 0,
          totalSpent: 0,
          lastActivity: item.date,
          status: 'active'
        };
      }

      if (item.type === 'booking_created') {
        acc[userId].bookings += 1;
        acc[userId].totalSpent += item.amount || 0;
      }

      if (item.date > acc[userId].lastActivity) {
        acc[userId].lastActivity = item.date;
      }

      return acc;
    }, {});

    // Get user details
    const userIds = Object.keys(customerStats);
    const users = await User.find({ _id: { $in: userIds } }).select('name email');

    const csvData = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      bookings: customerStats[user._id]?.bookings || 0,
      totalSpent: customerStats[user._id]?.totalSpent || 0,
      lastActivity: customerStats[user._id]?.lastActivity || null,
      status: customerStats[user._id]?.status || 'inactive'
    }));

    const fields = ['id', 'name', 'email', 'bookings', 'totalSpent', 'lastActivity', 'status'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment('customer-insights.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;