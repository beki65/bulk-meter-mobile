const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Get available months
router.get('/months', async (req, res) => {
  try {
    const months = await Customer.aggregate([
      { $unwind: '$billingHistory' },
      { $group: {
        _id: { month: '$billingHistory.month', year: '$billingHistory.year' },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const formatted = months.map(m => ({
      month: m._id.month,
      year: m._id.year,
      label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      count: m.count
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customers by DMA with month filter
router.get('/customers', async (req, res) => {
  try {
    const { dmaId, month, year, minConsumption, zeroConsumption } = req.query;
    
    // Build query
    let customers = await Customer.find({ dmaId });
    
    // Filter by month
    if (month && year) {
      customers = customers.filter(c => {
        const bill = c.billingHistory.find(b => b.month === parseInt(month) && b.year === parseInt(year));
        if (bill) {
          c.currentConsumption = bill.consumption;
          c.currentBill = bill.billAmount;
          return true;
        }
        return false;
      });
    }
    
    // Apply filters
    if (minConsumption) {
      customers = customers.filter(c => (c.currentConsumption || 0) >= parseFloat(minConsumption));
    }
    
    if (zeroConsumption === 'true') {
      customers = customers.filter(c => (c.currentConsumption || 0) === 0);
    }
    
    // Calculate stats
    const totalCustomers = customers.length;
    const zeroConsumptionCount = customers.filter(c => (c.currentConsumption || 0) === 0).length;
    const highConsumptionCount = customers.filter(c => (c.currentConsumption || 0) > 100).length;
    const avgConsumption = totalCustomers > 0 
      ? customers.reduce((sum, c) => sum + (c.currentConsumption || 0), 0) / totalCustomers 
      : 0;
    
    res.json({
      customers: customers.map(c => ({
        id: c.custKey,
        name: c.name,
        meterNumber: c.meterKey,
        currentConsumption: c.currentConsumption || 0,
        currentBill: c.currentBill || 0,
        status: 'active',
        latitude: c.latitude,
        longitude: c.longitude
      })),
      stats: {
        totalCustomers,
        zeroConsumption: zeroConsumptionCount,
        highConsumption: highConsumptionCount,
        averageConsumption: avgConsumption
      }
    });
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;