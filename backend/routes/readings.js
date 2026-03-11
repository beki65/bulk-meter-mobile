const express = require('express');
const Reading = require('../models/Reading');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all readings
// @route   GET /api/readings
router.get('/', protect, async (req, res) => {
  try {
    const readings = await Reading.find().sort({ timestamp: -1 });
    res.json(readings);
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get readings for specific DMA
// @route   GET /api/readings/:dmaId
router.get('/:dmaId', protect, async (req, res) => {
  try {
    const { dmaId } = req.params;
    const readings = await Reading.find({ dmaId }).sort({ timestamp: -1 });
    res.json(readings);
  } catch (error) {
    console.error('Error fetching DMA readings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new reading
// @route   POST /api/readings
router.post('/', protect, async (req, res) => {
  try {
    const readingData = {
      ...req.body,
      source: 'mobile',
      synced: true
    };
    
    const reading = new Reading(readingData);
    await reading.save();
    
    console.log(`✅ Saved to MongoDB: ${reading.dmaId} - ${reading.pointName} = ${reading.meterReading} m³`);
    res.status(201).json(reading);
  } catch (error) {
    console.error('Error saving reading:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get latest reading for a point
// @route   GET /api/readings/:dmaId/:pointName/latest
router.get('/:dmaId/:pointName/latest', protect, async (req, res) => {
  try {
    const { dmaId, pointName } = req.params;
    
    const reading = await Reading.findOne({ dmaId, pointName })
      .sort({ timestamp: -1 });
    
    if (reading) {
      res.json(reading);
    } else {
      res.status(404).json({ message: 'No readings found' });
    }
  } catch (error) {
    console.error('Error fetching latest reading:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get historical readings for a point
// @route   GET /api/readings/:dmaId/:pointName/history
router.get('/:dmaId/:pointName/history', protect, async (req, res) => {
  try {
    const { dmaId, pointName } = req.params;
    const { days = 30 } = req.query;
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const history = await Reading.find({
      dmaId,
      pointName,
      timestamp: { $gt: cutoff }
    }).sort({ timestamp: -1 });
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get DMA history with latest readings (for dashboard)
// @route   GET /api/dma/history
router.get('/api/dma/history', protect, async (req, res) => {
  try {
    // Get all readings
    const readings = await Reading.find();
    
    // Helper function to get latest reading
    const getLatestReading = (dmaId, pointName) => {
      const reading = readings
        .filter(r => r.dmaId === dmaId && r.pointName === pointName)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      
      return reading ? {
        value: reading.meterReading,
        timestamp: reading.timestamp,
        type: reading.pointType
      } : null;
    };

    res.json({
      zones: [
        {
          id: 'DMA-JFR',
          name: 'Jafar DMA',
          inlets: [
            { 
              name: 'Bulk Didly', 
              flowRate: null, 
              lastReading: getLatestReading('DMA-JFR', 'Bulk Didly'),
              status: getLatestReading('DMA-JFR', 'Bulk Didly') ? 'active' : 'pending' 
            },
            { 
              name: 'Shemachoch', 
              flowRate: null, 
              lastReading: getLatestReading('DMA-JFR', 'Shemachoch'),
              status: getLatestReading('DMA-JFR', 'Shemachoch') ? 'active' : 'pending' 
            }
          ],
          outlets: [
            { 
              name: 'Tel', 
              flowRate: null, 
              lastReading: getLatestReading('DMA-JFR', 'Tel'),
              status: getLatestReading('DMA-JFR', 'Tel') ? 'active' : 'pending' 
            }
          ],
          totalConnections: null,
          activeMeters: null,
          pressure: null,
          efficiency: null,
          status: 'pending'
        },
        // ... add other DMAs
      ],
      history: []
    });
  } catch (error) {
    console.error('Error fetching DMA history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;