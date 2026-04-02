// backend/routes/waterBalance.js
const express = require('express');
const router = express.Router();
const { calendarPeriods, calculateProRatedVolume, getPeriodForDate } = require('../utils/calendar');

// Get water balance summary for a specific period
router.get('/water-balance-summary', async (req, res) => {
  try {
    const { periodId } = req.query;
    
    if (!periodId || !calendarPeriods[periodId]) {
      return res.status(400).json({ error: 'Invalid period ID' });
    }
    
    const period = calendarPeriods[periodId];
    const dmas = await getDMAList(); // Your function to get DMA list
    const summary = [];
    
    for (const dma of dmas) {
      // Get readings for inlets within the period
      const inletReadings = await getReadingsInDateRange(
        dma.id,
        'inlet',
        period.startDate,
        period.endDate
      );
      
      // Get readings for outlets within the period
      const outletReadings = await getReadingsInDateRange(
        dma.id,
        'outlet',
        period.startDate,
        period.endDate
      );
      
      // Calculate totals with pro-ration
      const inflow = calculateTotalWithProRation(inletReadings, period);
      const outflow = calculateTotalWithProRation(outletReadings, period);
      
      summary.push({
        dmaId: dma.id,
        dmaName: dma.name,
        inflow: inflow,
        outflow: outflow,
        netInflow: inflow - outflow,
        period: period,
        readingCounts: {
          inletReadings: inletReadings.length,
          outletReadings: outletReadings.length
        }
      });
    }
    
    res.json({ 
      dmas: summary,
      period: period
    });
    
  } catch (error) {
    console.error('Error calculating water balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate total with pro-ration
const calculateTotalWithProRation = (readings, period) => {
  if (!readings || readings.length === 0) return 0;
  
  let totalVolume = 0;
  
  for (const reading of readings) {
    // If reading date is exactly at period boundaries
    const readingDate = new Date(reading.readingDate);
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);
    
    if (readingDate >= periodStart && readingDate <= periodEnd) {
      // Reading falls within the period - use as is
      totalVolume += reading.readingValue;
    } else {
      // Reading is outside period - need pro-ration based on adjacent periods
      const previousReading = await getPreviousReading(reading);
      const nextReading = await getNextReading(reading);
      
      if (previousReading && nextReading) {
        const timeDiff = new Date(nextReading.readingDate) - new Date(previousReading.readingDate);
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        const dailyRate = (nextReading.readingValue - previousReading.readingValue) / daysDiff;
        
        // Calculate volume for the period portion
        const overlapStart = new Date(Math.max(readingDate, periodStart));
        const overlapEnd = new Date(Math.min(
          nextReading.readingDate,
          periodEnd
        ));
        
        if (overlapEnd > overlapStart) {
          const overlapDays = (overlapEnd - overlapStart) / (1000 * 3600 * 24);
          totalVolume += dailyRate * overlapDays;
        }
      }
    }
  }
  
  return totalVolume;
};

// Get readings within a date range
const getReadingsInDateRange = async (dmaId, pointType, startDate, endDate) => {
  // Your database query here
  // Example MongoDB query:
  return await db.collection('readings').find({
    dmaId: dmaId,
    pointType: pointType,
    readingDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ readingDate: 1 }).toArray();
};

router.get('/available-periods', async (req, res) => {
  try {
    const periods = Object.values(calendarPeriods).map(period => ({
      id: period.id,
      label: `${period.name} (${formatDate(period.startDate)} - ${formatDate(period.endDate)})`,
      name: period.name,
      year: period.year,
      month: period.month,
      startDate: period.startDate,
      endDate: period.endDate,
      days: period.days
    }));
    
    res.json({ periods });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

module.exports = router;