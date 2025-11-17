const express = require('express');
const Service = require('../models/Service');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all services with advanced search and filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minDuration,
      maxDuration,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
      includeUnavailable = false
    } = req.query;

    // Build filter object
    let filter = {};
    if (!includeUnavailable) {
      filter.isAvailable = true;
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Duration range filter
    if (minDuration || maxDuration) {
      filter.duration = {};
      if (minDuration) filter.duration.$gte = parseInt(minDuration);
      if (maxDuration) filter.duration.$lte = parseInt(maxDuration);
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const services = await Service.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Service.countDocuments(filter);

    // Get categories for filter options
    const categories = await Service.distinct('category', { isAvailable: true });

    // Get price range for filter options
    const priceStats = await Service.aggregate([
      { $match: { isAvailable: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          minDuration: { $min: '$duration' },
          maxDuration: { $max: '$duration' }
        }
      }
    ]);

    res.json({
      success: true,
      services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        categories,
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0, minDuration: 0, maxDuration: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get service by ID
router.get('/:id', async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, service });
  } catch (error) {
    next(error);
  }
});

// Create service (admin only)
router.post('/', adminMiddleware, async (req, res, next) => {
  try {
    const { name, description, category, price, duration, image } = req.body;

    const service = new Service({
      name,
      description,
      category,
      price,
      duration,
      image,
    });

    await service.save();
    res.status(201).json({ success: true, service });
  } catch (error) {
    next(error);
  }
});

// Update service (admin only)
router.put('/:id', adminMiddleware, async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({ success: true, service });
  } catch (error) {
    next(error);
  }
});

// Delete service (admin only)
router.delete('/:id', adminMiddleware, async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
