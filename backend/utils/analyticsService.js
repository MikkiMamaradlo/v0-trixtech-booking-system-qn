const Analytics = require('../models/Analytics');

const logAnalytics = async (type, data) => {
  try {
    const analytics = new Analytics({
      type,
      bookingId: data.bookingId,
      userId: data.userId,
      amount: data.amount,
      details: data.details,
    });
    await analytics.save();
  } catch (error) {
    console.error('Analytics logging error:', error);
  }
};

// Enhanced analytics functions
const getRevenueTrends = async (days = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await Analytics.find({
      type: 'payment_received',
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const trends = analytics.reduce((acc, item) => {
      const date = item.date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (item.amount || 0);
      return acc;
    }, {});

    return trends;
  } catch (error) {
    console.error('Revenue trends error:', error);
    return {};
  }
};

const getServicePopularity = async (startDate, endDate) => {
  try {
    const analytics = await Analytics.find({
      type: 'booking_created',
      date: { $gte: startDate, $lte: endDate },
    });

    const serviceStats = analytics.reduce((acc, item) => {
      const serviceName = item.details?.serviceName || 'Unknown';
      if (!acc[serviceName]) {
        acc[serviceName] = { bookings: 0, revenue: 0 };
      }
      acc[serviceName].bookings += 1;
      acc[serviceName].revenue += item.amount || 0;
      return acc;
    }, {});

    return Object.entries(serviceStats)
      .map(([service, stats]) => ({ service, ...stats }))
      .sort((a, b) => b.bookings - a.bookings);
  } catch (error) {
    console.error('Service popularity error:', error);
    return [];
  }
};

const getCustomerInsights = async (startDate, endDate) => {
  try {
    const analytics = await Analytics.find({
      date: { $gte: startDate, $lte: endDate },
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

    return Object.entries(customerStats)
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  } catch (error) {
    console.error('Customer insights error:', error);
    return [];
  }
};

const getAnalytics = async (startDate, endDate) => {
  try {
    const analytics = await Analytics.find({
      date: { $gte: startDate, $lte: endDate },
    });

    // Calculate comprehensive summary
    const summary = {
      totalBookings: analytics.filter(a => a.type === 'booking_created').length,
      totalCancellations: analytics.filter(a => a.type === 'booking_cancelled').length,
      totalRevenue: analytics
        .filter(a => a.type === 'payment_received')
        .reduce((sum, a) => sum + (a.amount || 0), 0),
      newUsers: analytics.filter(a => a.type === 'user_signup').length,
      completedBookings: analytics.filter(a => a.type === 'booking_completed').length,
      averageBookingValue: 0,
      topServices: {},
      revenueByDay: {},
      customerRetention: 0,
      bookingConversionRate: 0,
    };

    // Calculate average booking value
    const bookingAmounts = analytics
      .filter(a => a.type === 'booking_created' && a.amount)
      .map(a => a.amount);
    if (bookingAmounts.length > 0) {
      summary.averageBookingValue = bookingAmounts.reduce((sum, amount) => sum + amount, 0) / bookingAmounts.length;
    }

    // Calculate top services
    const serviceBookings = analytics.filter(a => a.type === 'booking_created' && a.details?.serviceName);
    serviceBookings.forEach(booking => {
      const serviceName = booking.details.serviceName;
      summary.topServices[serviceName] = (summary.topServices[serviceName] || 0) + 1;
    });

    // Calculate revenue by day
    analytics.filter(a => a.type === 'payment_received').forEach(payment => {
      const day = payment.date.toISOString().split('T')[0];
      summary.revenueByDay[day] = (summary.revenueByDay[day] || 0) + (payment.amount || 0);
    });

    // Calculate customer retention (simplified)
    const uniqueUsers = new Set(analytics.map(a => a.userId).filter(id => id));
    const repeatUsers = analytics.filter(a => a.type === 'booking_created').reduce((acc, booking) => {
      acc[booking.userId] = (acc[booking.userId] || 0) + 1;
      return acc;
    }, {});
    const repeatUserCount = Object.values(repeatUsers).filter(count => count > 1).length;
    summary.customerRetention = uniqueUsers.size > 0 ? (repeatUserCount / uniqueUsers.size) * 100 : 0;

    return summary;
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return null;
  }
};

module.exports = {
  logAnalytics,
  getAnalytics,
  getRevenueTrends,
  getServicePopularity,
  getCustomerInsights,
};
