const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const readingRoutes = require('./routes/readings');
const mongoose = require('mongoose');
const turf = require('@turf/turf');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// ============= MIDDLEWARE =============
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'capacitor://localhost',
    'ionic://localhost',
    'https://localhost',
    'http://localhost',
    'https://bulk-meter-mobile.onrender.com',
    'https://dmadashboard.netlify.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ============= SIMPLE TEST ENDPOINTS =============

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Water Utility Backend is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

app.get('/api/test-endpoints', (req, res) => {
  res.json({
    endpoints: [
      '/api/health',
      '/api/test',
      '/api/months',
      '/api/customers',
      '/api/bulk-readings',
      '/api/bulk-readings/:dmaId/:pointName/latest',
      '/api/reading-history',
      '/api/dma/history'
    ]
  });
});

// ============= DMA BOUNDARIES FROM QGIS =============

// Jafar DMA Points - [latitude, longitude] format
const jafarPoints = [
  [8.979636347139426, 38.77195634015269],
  [8.979636158497764, 38.77195652879431],
  [8.979431105032548, 38.77203934247541],
  [8.97906891307927, 38.77217818272439],
  [8.978507515551664, 38.772419644026904],
  [8.978175506261138, 38.772550938610145],
  [8.977591471736453, 38.772796927312086],
  [8.977280590309874, 38.77292822189533],
  [8.976851996498473, 38.77311686353791],
  [8.976542624205022, 38.77325872205312],
  [8.976240797577292, 38.77335983397361],
  [8.97602348240533, 38.773447363695766],
  [8.975780511969985, 38.77354847561619],
  [8.975347390759184, 38.77371900766112],
  [8.974651680382223, 38.77401177949043],
  [8.974102355919731, 38.774248713393526],
  [8.973860894617529, 38.77436642577845],
  [8.97350926659619, 38.7745460126222],
  [8.973240640897478, 38.774681834604834],
  [8.97256153098498, 38.77510741015034],
  [8.97209068144603, 38.77467277980661],
  [8.971849220144168, 38.77414156494185],
  [8.971897512405532, 38.77236682437054],
  [8.972911649874831, 38.77181146337491],
  [8.97349115700005, 38.771642440463054],
  [8.974046517995447, 38.77076110670966],
  [8.973805056693964, 38.76951758100337],
  [8.973901641215102, 38.76898636613844],
  [8.974275906233755, 38.76833442062227],
  [8.974951997880217, 38.76747723299903],
  [8.974843340294916, 38.76620956116246],
  [8.975302116769164, 38.765871515339114],
  [8.975736747112819, 38.766257853422424],
  [8.977113076534504, 38.76725991782588],
  [8.978175506263053, 38.768938073875745],
  [8.978839524843256, 38.770248001439924],
  [8.979636347139426, 38.77195634015269]
];

// Yeka DMA Points - [latitude, longitude] format
const yekaPoints = [
  [9.029017912043312, 38.78849768813164],
  [9.028443849295689, 38.789564196561656],
  [9.027918400968499, 38.790424581522444],
  [9.02648326677666, 38.7928383443932],
  [9.024673298811315, 38.79582083122469],
  [9.023091809833955, 38.79855373221239],
  [9.021952831980474, 38.80064259264863],
  [9.02146902670024, 38.801435118639816],
  [9.020125706676403, 38.801491027278864],
  [9.019886420962713, 38.80122421799934],
  [9.02031943126993, 38.799822848515156],
  [9.020572586777817, 38.79886941325783],
  [9.020681958997546, 38.79756940361311],
  [9.020786742866662, 38.79663530752286],
  [9.021000201304433, 38.79489036619764],
  [9.02126425850455, 38.79207004604635],
  [9.02142489374706, 38.79047871752653],
  [9.021424444226238, 38.78969152516328],
  [9.021675076243461, 38.78855753310056],
  [9.022131445605163, 38.78678367356396],
  [9.022370177800921, 38.785778476256695],
  [9.02244779282681, 38.78549918101537],
  [9.022811964806563, 38.78558779627207],
  [9.023135087654916, 38.78566560294601],
  [9.023915883989899, 38.78587409866449],
  [9.025208894795346, 38.786185277389166],
  [9.026357516287758, 38.78666343588946],
  [9.027850784057836, 38.78762024306299],
  [9.029068396595626, 38.788341612462496],
  [9.029058873865926, 38.78842828323634],
  [9.029017912043312, 38.78849768813164]
];

// Create polygons - Turf expects [longitude, latitude]
const jafarPolygon = turf.polygon([jafarPoints.map(p => [p[1], p[0]])]);
const yekaPolygon = turf.polygon([yekaPoints.map(p => [p[1], p[0]])]);

console.log('✅ DMA Boundaries initialized');

// Function to determine DMA from coordinates
function determineDMA(latitude, longitude) {
  if (!latitude || !longitude) return 'DMA-UNKNOWN';
  const point = turf.point([longitude, latitude]);
  if (turf.booleanPointInPolygon(point, jafarPolygon)) return 'DMA-JFR';
  if (turf.booleanPointInPolygon(point, yekaPolygon)) return 'DMA-YKA';
  return 'DMA-UNKNOWN';
}

// ============= CUSTOMER SCHEMA =============
const CustomerSchema = new mongoose.Schema({
  custKey: { type: String, unique: true, index: true },
  name: String,
  meterKey: String,
  latitude: Number,
  longitude: Number,
  billingHistory: [{
    period: String,
    consumption: Number,
    billAmount: Number,
    totalAmount: Number,
    meterDiameter: Number,
    month: Number,
    year: Number,
    meterKey: String
  }],
  createdAt: { type: Date, default: Date.now }
});

CustomerSchema.index({ custKey: 1 });
CustomerSchema.index({ latitude: 1, longitude: 1 });
CustomerSchema.index({ 'billingHistory.month': 1, 'billingHistory.year': 1 });

const Customer = mongoose.model('Customer', CustomerSchema);

// ============= READING MODELS =============

// Mobile Readings Schema (from legacy bulk-readings)
const ReadingSchema = new mongoose.Schema({
  dmaId: String,
  pointName: String,
  meterReading: Number,
  timestamp: Date,
  date: String,
  size: String,
  notes: String,
  latitude: Number,
  longitude: Number,
  pointType: String,
  source: String,
  userId: String,
  userName: String
}, { timestamps: true });

const Reading = mongoose.models.Reading || mongoose.model('Reading', ReadingSchema);

// Manual Readings Schema
const ReadingHistorySchema = new mongoose.Schema({
  dmaId: { type: String, required: true, index: true },
  pointName: { type: String, required: true },
  pointType: { type: String, enum: ['inlet', 'outlet'], required: true },
  readingDate: { type: Date, required: true, index: true },
  readingValue: { type: Number, required: true },
  meterId: String,
  source: { type: String, enum: ['manual', 'mobile', 'import', 'api', 'daily'], default: 'manual' },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

ReadingHistorySchema.index({ dmaId: 1, pointName: 1, readingDate: -1 });

const ReadingHistory = mongoose.models.ReadingHistory || mongoose.model('ReadingHistory', ReadingHistorySchema);

// ============= READING CALENDAR & DMA CONFIGURATION =============

const READING_CALENDAR = {
  1: 13, 2: 12, 3: 14, 4: 13, 5: 13, 6: 12,
  7: 12, 8: 11, 9: 13, 10: 15, 11: 14, 12: 14
};

const DMA_POINTS = {
  'DMA-JFR': {
    name: 'Jafar DMA',
    inlets: [{ name: 'Bulk Didly' }, { name: 'Shemachoch' }],
    outlets: [{ name: 'Tel' }]
  },
  'DMA-YKA': {
    name: 'Yeka DMA',
    inlets: [{ name: 'Misrak' }, { name: 'English' }, { name: 'Wubet' }],
    outlets: []
  },
  'DMA-2019': {
    name: '2019 DMA',
    inlets: [{ name: 'Inlet 1' }, { name: 'Inlet 2' }],
    outlets: []
  }
};

// ============= HELPER FUNCTIONS =============

function getScheduledReadingDate(year, month) {
  const readingDay = READING_CALENDAR[month];
  return new Date(year, month - 1, readingDay);
}

async function findClosestReading(dmaId, pointName, targetDate) {
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - 15);
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 15);
  
  const readings = await ReadingHistory.find({
    dmaId, pointName,
    readingDate: { $gte: startDate, $lte: endDate }
  }).sort({ readingDate: 1 });
  
  if (readings.length === 0) return null;
  
  let closest = readings[0];
  let minDiff = Math.abs(new Date(closest.readingDate) - targetDate);
  
  for (let i = 1; i < readings.length; i++) {
    const diff = Math.abs(new Date(readings[i].readingDate) - targetDate);
    if (diff < minDiff) {
      minDiff = diff;
      closest = readings[i];
    }
  }
  
  return {
    reading: closest,
    daysDifference: minDiff / (1000 * 60 * 60 * 24),
    isExact: minDiff === 0
  };
}

function calculateConsumption(prevReading, currReading, scheduledPrevDate, scheduledCurrDate) {
  const actualConsumption = currReading.readingValue - prevReading.readingValue;
  const actualDays = (currReading.readingDate - prevReading.readingDate) / (1000 * 60 * 60 * 24);
  const dailyRate = actualConsumption / actualDays;
  const scheduledDays = (scheduledCurrDate - scheduledPrevDate) / (1000 * 60 * 60 * 24);
  const proRatedConsumption = dailyRate * scheduledDays;
  
  return {
    actualConsumption, actualDays, dailyRate, scheduledDays, proRatedConsumption,
    quality: (prevReading.isExact && currReading.isExact) ? 'good' : 'estimated'
  };
}

// ============= API ROUTES =============

app.use('/api/auth', authRoutes);
app.use('/api/readings', readingRoutes);

// ============= LEGACY ENDPOINTS =============

let bulkReadings = [];

// DMA History
app.get('/api/dma/history', async (req, res) => {
  try {
    const getLatestReading = async (dmaId, pointName) => {
      const reading = await Reading.findOne({ dmaId, pointName }).sort({ timestamp: -1 });
      return reading ? { value: reading.meterReading, timestamp: reading.timestamp, type: reading.pointType } : null;
    };

    const zones = [
      {
        id: 'DMA-JFR', name: 'Jafar DMA',
        inlets: [
          { name: 'Bulk Didly', lastReading: await getLatestReading('DMA-JFR', 'Bulk Didly'), status: 'pending' },
          { name: 'Shemachoch', lastReading: await getLatestReading('DMA-JFR', 'Shemachoch'), status: 'pending' }
        ],
        outlets: [{ name: 'Tel', lastReading: await getLatestReading('DMA-JFR', 'Tel'), status: 'pending' }]
      },
      {
        id: 'DMA-YKA', name: 'Yeka DMA',
        inlets: [
          { name: 'Misrak', lastReading: await getLatestReading('DMA-YKA', 'Misrak'), status: 'pending' },
          { name: 'English', lastReading: await getLatestReading('DMA-YKA', 'English'), status: 'pending' },
          { name: 'Wubet', lastReading: await getLatestReading('DMA-YKA', 'Wubet'), status: 'pending' }
        ],
        outlets: []
      },
      {
        id: 'DMA-2019', name: '2019 DMA',
        inlets: [
          { name: 'Inlet 1', lastReading: await getLatestReading('DMA-2019', 'Inlet 1'), status: 'unknown' },
          { name: 'Inlet 2', lastReading: await getLatestReading('DMA-2019', 'Inlet 2'), status: 'unknown' }
        ],
        outlets: [],
        notes: 'Data pending - survey required'
      }
    ];
    res.json({ zones, history: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch DMA history' });
  }
});

// Bulk Readings - GET (all)
app.get('/api/bulk-readings', (req, res) => { 
  console.log('✅ GET /api/bulk-readings called');
  res.json(bulkReadings); 
});

// Bulk Readings - POST (save)
app.post('/api/bulk-readings', async (req, res) => {
  try {
    const { dmaId, pointName, meterReading, timestamp, date, size, notes, latitude, longitude, pointType = 'inlet', userId, userName } = req.body;
    
    console.log('📥 Received reading:', { dmaId, pointName, meterReading });
    
    if (!dmaId || !pointName || meterReading === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const reading = new Reading({
      dmaId, pointName, meterReading: parseFloat(meterReading),
      timestamp: timestamp || new Date(), date: date || new Date().toISOString().split('T')[0],
      size: size || 'Unknown', notes: notes || '', latitude: latitude || null, longitude: longitude || null,
      pointType, source: 'mobile', userId, userName
    });
    
    await reading.save();
    
    const newReading = { 
      id: Date.now(), 
      dmaId, pointName, 
      meterReading: parseFloat(meterReading), 
      timestamp: timestamp || new Date().toISOString(), 
      date: date || new Date().toISOString().split('T')[0], 
      size: size || 'Unknown', 
      notes: notes || '', 
      latitude: latitude || null, 
      longitude: longitude || null, 
      pointType, 
      source: 'mobile', 
      receivedAt: new Date().toISOString() 
    };
    bulkReadings.push(newReading);
    
    res.status(201).json({ message: 'Reading saved successfully', id: reading._id });
  } catch (error) {
    console.error('Error saving reading:', error);
    res.status(500).json({ error: 'Failed to save reading' });
  }
});
app.get('/api/mongo-readings', async (req, res) => {
  try {
    const readings = await Reading.find().sort({ timestamp: -1 }).limit(10);
    res.json({
      total: readings.length,
      readings: readings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Bulk Readings - Get by DMA
app.get('/api/bulk-readings/:dmaId', (req, res) => {
  const { dmaId } = req.params;
  res.json(bulkReadings.filter(r => r.dmaId === dmaId));
});

// Bulk Readings - Get latest by point
app.get('/api/bulk-readings/:dmaId/:pointName/latest', async (req, res) => {
  try {
    const { dmaId, pointName } = req.params;
    const reading = await Reading.findOne({ dmaId, pointName }).sort({ timestamp: -1 });
    reading ? res.json(reading) : res.status(404).json({ message: 'No readings found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reading' });
  }
});

// Bulk Readings - Get history by point
app.get('/api/bulk-readings/:dmaId/:pointName/history', async (req, res) => {
  try {
    const { dmaId, pointName } = req.params;
    const { days = 30 } = req.query;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const history = await Reading.find({ dmaId, pointName, timestamp: { $gt: cutoff } }).sort({ timestamp: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ============= CUSTOMER DATA ENDPOINTS =============

// Get available months
app.get('/api/months', async (req, res) => {
  try {
    const months = await Customer.aggregate([
      { $unwind: '$billingHistory' },
      { $group: { _id: { month: '$billingHistory.month', year: '$billingHistory.year' }, count: { $sum: 1 } } },
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
    res.json([]);
  }
});

// Get customers by DMA
app.get('/api/customers', async (req, res) => {
  try {
    const { dmaId, month, year, minConsumption, zeroConsumption, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let allCustomers = await Customer.find({}).lean();
    let dmaCustomers = allCustomers.filter(c => determineDMA(c.latitude, c.longitude) === dmaId);
    let customersWithData = [];
    let totalMonthConsumption = 0;
    
    if (month && year) {
      const monthNum = parseInt(month), yearNum = parseInt(year);
      customersWithData = dmaCustomers.filter(c => {
        const bill = c.billingHistory.find(b => b.month === monthNum && b.year === yearNum);
        if (bill) { 
          c.currentConsumption = bill.consumption; 
          totalMonthConsumption += bill.consumption; 
          return true; 
        }
        return false;
      });
    } else { 
      customersWithData = dmaCustomers; 
    }
    
    let filtered = customersWithData;
    if (minConsumption) { 
      const min = parseFloat(minConsumption); 
      filtered = filtered.filter(c => (c.currentConsumption || 0) >= min); 
    }
    if (zeroConsumption === 'true') { 
      filtered = filtered.filter(c => (c.currentConsumption || 0) === 0); 
    }
    
    const totalCount = filtered.length;
    const paginatedCustomers = filtered.slice(skip, skip + parseInt(limit));
    const totalCustomers = filtered.length;
    const zeroConsumptionCount = filtered.filter(c => (c.currentConsumption || 0) === 0).length;
    const highConsumptionCount = filtered.filter(c => (c.currentConsumption || 0) > 100).length;
    const avgConsumption = totalCustomers > 0 ? filtered.reduce((sum, c) => sum + (c.currentConsumption || 0), 0) / totalCustomers : 0;
    
    const customersWithChanges = paginatedCustomers.map(c => {
      const meterKeys = c.billingHistory.map(b => b.meterKey).filter(k => k);
      const uniqueKeys = [...new Set(meterKeys)];
      return { 
        id: c.custKey, 
        name: c.name, 
        meterNumber: c.meterKey, 
        currentConsumption: c.currentConsumption || 0, 
        status: 'active', 
        meterKeyChanged: uniqueKeys.length > 1 
      };
    });
    
    res.json({ 
      customers: customersWithChanges, 
      stats: { 
        totalCustomers, 
        zeroConsumption: zeroConsumptionCount, 
        highConsumption: highConsumptionCount, 
        averageConsumption: avgConsumption, 
        totalConsumption: totalMonthConsumption 
      }, 
      pagination: { 
        currentPage: parseInt(page), 
        totalPages: Math.ceil(totalCount / parseInt(limit)), 
        totalItems: totalCount, 
        itemsPerPage: parseInt(limit) 
      } 
    });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

// Get customer history
app.get('/api/customers/:customerId/history', async (req, res) => {
  try {
    const customer = await Customer.findOne({ custKey: req.params.customerId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const sortedHistory = [...customer.billingHistory].sort((a, b) => { 
      if (a.year !== b.year) return a.year - b.year; 
      return a.month - b.month; 
    });
    res.json({ 
      customer: { 
        id: customer.custKey, 
        name: customer.name, 
        meterNumber: customer.meterKey, 
        address: customer.address 
      }, 
      history: sortedHistory.map(bill => ({ 
        period: bill.period, 
        month: bill.month, 
        year: bill.year, 
        consumption: bill.consumption || 0, 
        billAmount: bill.billAmount || 0 
      })) 
    });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

// Get all customers summary
app.get('/api/all-customers', async (req, res) => {
  try {
    const total = await Customer.countDocuments();
    const withCoords = await Customer.countDocuments({ latitude: { $ne: null } });
    res.json({ total, withCoordinates: withCoords });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

// ============= READING HISTORY ENDPOINTS =============

// Get all reading history
app.get('/api/reading-history', async (req, res) => {
  try {
    let allReadings = [];
    try {
      const manualReadings = await ReadingHistory.find().sort({ readingDate: -1 }).lean();
      allReadings.push(...manualReadings.map(r => ({ ...r, source: 'manual' })));
    } catch (err) {}
    try {
      const mobileReadings = await Reading.find({}).sort({ timestamp: -1 }).lean();
      allReadings.push(...mobileReadings.map(r => ({ 
        _id: r._id, 
        dmaId: r.dmaId, 
        pointName: r.pointName, 
        pointType: r.pointType || 'inlet', 
        readingDate: r.timestamp, 
        readingValue: r.meterReading, 
        source: 'mobile' 
      })));
    } catch (err) {}
    allReadings.sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));
    res.json(allReadings);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

// Get reading history for specific point
app.get('/api/reading-history/:dmaId/:pointName', async (req, res) => {
  try {
    const { dmaId, pointName } = req.params;
    let allReadings = [];
    try {
      const manualReadings = await ReadingHistory.find({ dmaId, pointName }).sort({ readingDate: -1 }).lean();
      allReadings.push(...manualReadings.map(r => ({ ...r, source: 'manual' })));
    } catch (err) {}
    try {
      const mobileReadings = await Reading.find({ dmaId, pointName, meterReading: { $exists: true } }).sort({ timestamp: -1 }).lean();
      allReadings.push(...mobileReadings.map(r => ({ 
        _id: r._id, 
        dmaId: r.dmaId, 
        pointName: r.pointName, 
        pointType: r.pointType || 'inlet', 
        readingDate: r.timestamp, 
        readingValue: r.meterReading, 
        source: 'mobile' 
      })));
    } catch (err) {}
    allReadings.sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));
    res.json(allReadings);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

// Save manual reading
app.post('/api/reading-history', async (req, res) => {
  try {
    const { dmaId, pointName, pointType, readingDate, readingValue, meterId, notes } = req.body;
    const newReading = new ReadingHistory({ 
      dmaId, pointName, pointType, 
      readingDate: new Date(readingDate), 
      readingValue: parseFloat(readingValue), 
      meterId, notes, 
      source: 'manual' 
    });
    await newReading.save();
    res.status(201).json(newReading);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

// ============= OTHER LEGACY ENDPOINTS =============

// NRW Calculator
app.post('/api/nrw/calculate', (req, res) => {
  const systemInput = parseFloat(req.body.systemInput) || 950000;
  const billedConsumption = parseFloat(req.body.billedConsumption) || 775000;
  const nrwVolume = systemInput - billedConsumption;
  const nrwPercentage = (nrwVolume / systemInput * 100).toFixed(2);
  
  res.json({ 
    nrwPercentage, 
    nrwVolume, 
    components: { 
      leaks: nrwVolume * 0.4, 
      meterInaccuracies: nrwVolume * 0.3, 
      unauthorizedConsumption: nrwVolume * 0.2, 
      bursts: nrwVolume * 0.1 
    }
  });
});

// Bill Extraction
app.post('/api/bill/extract', async (req, res) => {
  try {
    const response = await axios.post('http://197.156.64.238:5001/extract', req.body, { timeout: 3000, validateStatus: false }).catch(() => null);
    response && response.data ? res.json(response.data) : res.json({ message: 'Using mock data' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract bill data' });
  }
});

// Analytics Overview
app.get('/api/analytics/overview', (req, res) => {
  res.json({ 
    totalCustomers: 43090, 
    activeMeters: 43090, 
    monthlyConsumption: 425000,
    nrwAverage: 18.5
  });
});

// Shapefile endpoint
app.get('/api/shapefile/:dmaId', (req, res) => { 
  res.json({ message: `Shapefile for ${req.params.dmaId} would be served here` }); 
});

// Debug endpoint
app.get('/api/debug-mobile-readings', async (req, res) => {
  try {
    const totalCount = await Reading.countDocuments();
    const allMobileReadings = await Reading.find().sort({ timestamp: -1 }).limit(20);
    res.json({ totalMobileReadings: totalCount, sampleReadings: allMobileReadings });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});
// ============= WATER BALANCE SUMMARY FOR CUSTOM CALENDAR =============

// Custom Calendar Periods (matching frontend)
const CALENDAR_PERIODS = {
  // 2025 Periods
  '2025-january': {
    id: '2025-january',
    name: 'January 2025',
    month: 'january',
    year: 2025,
    startDate: '2024-12-14',
    endDate: '2025-01-13',
    days: 31
  },
  '2025-february': {
    id: '2025-february',
    name: 'February 2025',
    month: 'february',
    year: 2025,
    startDate: '2025-01-14',
    endDate: '2025-02-12',
    days: 30
  },
  '2025-march': {
    id: '2025-march',
    name: 'March 2025',
    month: 'march',
    year: 2025,
    startDate: '2025-02-13',
    endDate: '2025-03-14',
    days: 30
  },
  '2025-april': {
    id: '2025-april',
    name: 'April 2025',
    month: 'april',
    year: 2025,
    startDate: '2025-03-14',
    endDate: '2025-04-13',
    days: 31
  },
  '2025-may': {
    id: '2025-may',
    name: 'May 2025',
    month: 'may',
    year: 2025,
    startDate: '2025-04-14',
    endDate: '2025-05-13',
    days: 30
  },
  '2025-june': {
    id: '2025-june',
    name: 'June 2025',
    month: 'june',
    year: 2025,
    startDate: '2025-05-14',
    endDate: '2025-06-12',
    days: 30
  },
  '2025-july': {
    id: '2025-july',
    name: 'July 2025',
    month: 'july',
    year: 2025,
    startDate: '2025-06-13',
    endDate: '2025-07-12',
    days: 30
  },
  '2025-august': {
    id: '2025-august',
    name: 'August 2025',
    month: 'august',
    year: 2025,
    startDate: '2025-07-13',
    endDate: '2025-08-11',
    days: 30
  },
  '2025-september': {
    id: '2025-september',
    name: 'September 2025',
    month: 'september',
    year: 2025,
    startDate: '2025-08-12',
    endDate: '2025-09-13',
    days: 33
  },
  '2025-october': {
    id: '2025-october',
    name: 'October 2025',
    month: 'october',
    year: 2025,
    startDate: '2025-09-14',
    endDate: '2025-10-15',
    days: 32
  },
  '2025-november': {
    id: '2025-november',
    name: 'November 2025',
    month: 'november',
    year: 2025,
    startDate: '2025-10-16',
    endDate: '2025-11-14',
    days: 30
  },
  '2025-december': {
    id: '2025-december',
    name: 'December 2025',
    month: 'december',
    year: 2025,
    startDate: '2025-11-15',
    endDate: '2025-12-14',
    days: 30
  },
  // 2026 Periods
  '2026-january': {
    id: '2026-january',
    name: 'January 2026',
    month: 'january',
    year: 2026,
    startDate: '2025-12-15',
    endDate: '2026-01-13',
    days: 30
  },
  '2026-february': {
    id: '2026-february',
    name: 'February 2026',
    month: 'february',
    year: 2026,
    startDate: '2026-01-14',
    endDate: '2026-02-12',
    days: 30
  },
  '2026-march': {
    id: '2026-march',
    name: 'March 2026',
    month: 'march',
    year: 2026,
    startDate: '2026-02-13',
    endDate: '2026-03-14',
    days: 30
  },
  '2026-april': {
    id: '2026-april',
    name: 'April 2026',
    month: 'april',
    year: 2026,
    startDate: '2026-03-14',
    endDate: '2026-04-13',
    days: 31
  },
  '2026-may': {
    id: '2026-may',
    name: 'May 2026',
    month: 'may',
    year: 2026,
    startDate: '2026-04-14',
    endDate: '2026-05-13',
    days: 30
  },
  '2026-june': {
    id: '2026-june',
    name: 'June 2026',
    month: 'june',
    year: 2026,
    startDate: '2026-05-14',
    endDate: '2026-06-12',
    days: 30
  },
  '2026-july': {
    id: '2026-july',
    name: 'July 2026',
    month: 'july',
    year: 2026,
    startDate: '2026-06-13',
    endDate: '2026-07-12',
    days: 30
  },
  '2026-august': {
    id: '2026-august',
    name: 'August 2026',
    month: 'august',
    year: 2026,
    startDate: '2026-07-13',
    endDate: '2026-08-11',
    days: 30
  },
  '2026-september': {
    id: '2026-september',
    name: 'September 2026',
    month: 'september',
    year: 2026,
    startDate: '2026-08-12',
    endDate: '2026-09-13',
    days: 33
  },
  '2026-october': {
    id: '2026-october',
    name: 'October 2026',
    month: 'october',
    year: 2026,
    startDate: '2026-09-14',
    endDate: '2026-10-15',
    days: 32
  },
  '2026-november': {
    id: '2026-november',
    name: 'November 2026',
    month: 'november',
    year: 2026,
    startDate: '2026-10-16',
    endDate: '2026-11-14',
    days: 30
  },
  '2026-december': {
    id: '2026-december',
    name: 'December 2026',
    month: 'december',
    year: 2026,
    startDate: '2026-11-15',
    endDate: '2026-12-14',
    days: 30
  }
};

// Get available periods endpoint
app.get('/api/available-periods', (req, res) => {
  try {
    const periods = Object.values(CALENDAR_PERIODS).map(period => ({
      id: period.id,
      label: `${period.name} (${formatShortDate(period.startDate)} - ${formatShortDate(period.endDate)})`,
      name: period.name,
      year: period.year,
      month: period.month,
      startDate: period.startDate,
      endDate: period.endDate,
      days: period.days
    }));
    
    // Sort by year and month (most recent first)
    periods.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const monthOrder = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november', 'december'];
      return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
    });
    
    res.json({ periods });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to format dates for display
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
// Debug endpoint to see all readings
app.get('/api/debug-all-readings', async (req, res) => {
  try {
    const manualReadings = await ReadingHistory.find({}).sort({ readingDate: -1 }).limit(50).lean();
    const mobileReadings = await Reading.find({}).sort({ timestamp: -1 }).limit(50).lean();
    
    res.json({
      manualReadings: manualReadings.map(r => ({
        id: r._id,
        dmaId: r.dmaId,
        pointName: r.pointName,
        pointType: r.pointType,
        readingValue: r.readingValue,
        readingDate: r.readingDate,
        source: 'manual'
      })),
      mobileReadings: mobileReadings.map(r => ({
        id: r._id,
        dmaId: r.dmaId,
        pointName: r.pointName,
        pointType: r.pointType,
        readingValue: r.meterReading,
        readingDate: r.timestamp,
        source: 'mobile'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Water Balance Summary endpoint
// ============= CORRECTED WATER BALANCE WITH CONSUMPTION CALCULATION =============

// ============= FIXED WATER BALANCE WITH PROPER CONSUMPTION CALCULATION =============

// ============= COMPLETE FIXED WATER BALANCE WITH MOBILE READINGS =============

// ============= CORRECTED WATER BALANCE - FIND CLOSEST READINGS TO PERIOD BOUNDARIES =============

// ============= SIMPLIFIED TEST FOR JAFAR DMA ONLY =============

// ============= CORRECT WATER BALANCE WITH ACTUAL DATABASE DATA =============

// ============= CORRECT WATER BALANCE - USING PERIOD BOUNDARY DATES =============

app.get('/api/water-balance-summary', async (req, res) => {
  console.log('\n💧 WATER BALANCE SUMMARY CALCULATION');
  console.log('=' .repeat(60));
  
  try {
    const { periodId } = req.query;
    
    if (!periodId) {
      return res.status(400).json({ error: 'periodId is required' });
    }
    
    // Define periods with exact boundary dates
    const periods = {
      '2026-march': {
        name: 'March 2026',
        startDate: new Date('2026-02-13'),
        endDate: new Date('2026-03-14'),
        days: 30
      },
      '2026-february': {
        name: 'February 2026',
        startDate: new Date('2026-01-14'),
        endDate: new Date('2026-02-12'),
        days: 30
      },
      '2026-january': {
        name: 'January 2026',
        startDate: new Date('2025-12-15'),
        endDate: new Date('2026-01-13'),
        days: 30
      },
      // 2025 periods
      '2025-march': {
        name: 'March 2025',
        startDate: new Date('2025-02-13'),
        endDate: new Date('2025-03-14'),
        days: 30
      }
    };
    
    const period = periods[periodId];
    if (!period) {
      return res.status(404).json({ error: `Period ${periodId} not found` });
    }
    
    console.log(`\n📅 Period: ${period.name}`);
    console.log(`   Start Date: ${period.startDate.toISOString().split('T')[0]}`);
    console.log(`   End Date: ${period.endDate.toISOString().split('T')[0]}`);
    console.log(`   Days: ${period.days}\n`);
    
    // Get all DMAs
    const dmaList = [
      { id: 'DMA-JFR', name: 'Jafar DMA' },
      { id: 'DMA-YKA', name: 'Yeka DMA' }
    ];
    
    const results = [];
    
    for (const dma of dmaList) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📍 DMA: ${dma.name} (${dma.id})`);
      console.log(`${'='.repeat(50)}`);
      
      // Get all readings for this DMA
      const manualReadings = await ReadingHistory.find({
        dmaId: dma.id
      }).lean();
      
      const mobileReadings = await Reading.find({
        dmaId: dma.id
      }).lean();
      
      // Combine all readings
      const allReadings = [];
      
      manualReadings.forEach(r => {
        allReadings.push({
          value: r.readingValue,
          date: new Date(r.readingDate),
          source: 'manual',
          pointType: r.pointType,
          pointName: r.pointName
        });
      });
      
      mobileReadings.forEach(r => {
        allReadings.push({
          value: r.meterReading,
          date: new Date(r.timestamp),
          source: 'mobile',
          pointType: r.pointType,
          pointName: r.pointName
        });
      });
      
      // Group readings by point name and type
      const pointReadings = {};
      
      allReadings.forEach(reading => {
        const key = `${reading.pointType}_${reading.pointName}`;
        if (!pointReadings[key]) {
          pointReadings[key] = {
            pointName: reading.pointName,
            pointType: reading.pointType,
            readings: []
          };
        }
        pointReadings[key].readings.push({
          value: reading.value,
          date: reading.date,
          source: reading.source
        });
      });
      
      // For each point, find readings exactly on or closest to period boundaries
      const inletDifferences = [];
      const outletDifferences = [];
      
      for (const [key, point] of Object.entries(pointReadings)) {
        // Sort readings by date
        point.readings.sort((a, b) => a.date - b.date);
        
        console.log(`\n  📍 ${point.pointType.toUpperCase()}: ${point.pointName}`);
        console.log(`     Readings:`);
        point.readings.forEach(r => {
          console.log(`       ${r.source}: ${r.value.toLocaleString()} m³ on ${r.date.toISOString().split('T')[0]}`);
        });
        
        // Find reading on or closest to START DATE
        let startReading = null;
        let startDiff = Infinity;
        
        for (const reading of point.readings) {
          const diff = Math.abs(reading.date - period.startDate);
          if (diff < startDiff) {
            startDiff = diff;
            startReading = reading;
          }
        }
        
        // Find reading on or closest to END DATE
        let endReading = null;
        let endDiff = Infinity;
        
        for (const reading of point.readings) {
          const diff = Math.abs(reading.date - period.endDate);
          if (diff < endDiff) {
            endDiff = diff;
            endReading = reading;
          }
        }
        
        if (startReading && endReading) {
          // Calculate difference: End Reading - Start Reading
          const difference = endReading.value - startReading.value;
          const absDifference = Math.abs(difference);
          
          console.log(`\n     Calculation:`);
          console.log(`       Start (${startReading.date.toISOString().split('T')[0]}): ${startReading.value.toLocaleString()} m³`);
          console.log(`       End (${endReading.date.toISOString().split('T')[0]}): ${endReading.value.toLocaleString()} m³`);
          console.log(`       Difference: ${difference.toLocaleString()} m³ (absolute: ${absDifference.toLocaleString()} m³)`);
          
          if (point.pointType === 'inlet') {
            inletDifferences.push({
              pointName: point.pointName,
              startReading: {
                value: startReading.value,
                date: startReading.date,
                source: startReading.source
              },
              endReading: {
                value: endReading.value,
                date: endReading.date,
                source: endReading.source
              },
              difference: absDifference
            });
          } else if (point.pointType === 'outlet') {
            outletDifferences.push({
              pointName: point.pointName,
              startReading: {
                value: startReading.value,
                date: startReading.date,
                source: startReading.source
              },
              endReading: {
                value: endReading.value,
                date: endReading.date,
                source: endReading.source
              },
              difference: absDifference
            });
          }
        }
      }
      
      // Calculate totals
      const totalInlet = inletDifferences.reduce((sum, item) => sum + item.difference, 0);
      const totalOutlet = outletDifferences.reduce((sum, item) => sum + item.difference, 0);
      const systemInflow = totalInlet - totalOutlet;
      
      console.log(`\n  📊 SUMMARY:`);
      console.log(`     Inlet Differences:`);
      inletDifferences.forEach(item => {
        console.log(`       ${item.pointName}: ${item.difference.toLocaleString()} m³`);
      });
      console.log(`     Total Inlet: ${totalInlet.toLocaleString()} m³`);
      console.log(`     Total Outlet: ${totalOutlet.toLocaleString()} m³`);
      console.log(`     System Inflow: ${systemInflow.toLocaleString()} m³`);
      
      results.push({
        dmaId: dma.id,
        dmaName: dma.name,
        totalInlet: totalInlet,
        totalOutlet: totalOutlet,
        systemInflow: systemInflow,
        period: {
          name: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          days: period.days
        },
        inletDetails: inletDifferences,
        outletDetails: outletDifferences
      });
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ WATER BALANCE CALCULATION COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    
    res.json({ dmas: results });
    
  } catch (error) {
    console.error('Error in water-balance-summary:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});
// Simple endpoint to test reading aggregation
app.get('/api/test-water-balance', async (req, res) => {
  try {
    // Get all readings for March 2026 period
    const periodStart = new Date('2026-02-13');
    const periodEnd = new Date('2026-03-14');
    
    const allManualReadings = await ReadingHistory.find({
      readingDate: { $gte: periodStart, $lte: periodEnd }
    }).lean();
    
    const allMobileReadings = await Reading.find({
      timestamp: { $gte: periodStart, $lte: periodEnd }
    }).lean();
    
    res.json({
      period: { start: periodStart, end: periodEnd },
      manualReadingsCount: allManualReadings.length,
      mobileReadingsCount: allMobileReadings.length,
      manualReadings: allManualReadings,
      mobileReadings: allMobileReadings.map(r => ({
        dmaId: r.dmaId,
        pointName: r.pointName,
        pointType: r.pointType,
        meterReading: r.meterReading,
        timestamp: r.timestamp
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Add this right before your app.listen
// SIMPLIFIED TEST ENDPOINTS - Add these at the very end, right before app.listen

// Test endpoint 1: Simple periods
app.get('/api/test-periods', (req, res) => {
  console.log('✅ Test periods endpoint called');
  res.json({ 
    message: 'Test endpoint working',
    periods: [
      { id: '2026-march', name: 'March 2026', startDate: '2026-02-13', endDate: '2026-03-14' }
    ]
  });
});

// Test endpoint 2: Direct database query for March 2026
app.get('/api/test-march-readings', async (req, res) => {
  try {
    console.log('🔍 Querying readings for March 2026...');
    
    const periodStart = new Date('2026-02-13');
    const periodEnd = new Date('2026-03-14');
    
    console.log(`Period: ${periodStart} to ${periodEnd}`);
    
    // Query manual readings
    const manualReadings = await ReadingHistory.find({
      readingDate: { 
        $gte: periodStart, 
        $lte: periodEnd 
      }
    }).lean();
    
    console.log(`Found ${manualReadings.length} manual readings`);
    
    // Query mobile readings
    const mobileReadings = await Reading.find({
      timestamp: { 
        $gte: periodStart, 
        $lte: periodEnd 
      }
    }).lean();
    
    console.log(`Found ${mobileReadings.length} mobile readings`);
    
    res.json({
      success: true,
      manualReadingsCount: manualReadings.length,
      manualReadings: manualReadings,
      mobileReadingsCount: mobileReadings.length,
      mobileReadings: mobileReadings
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Test endpoint 3: All readings (no date filter)
app.get('/api/test-all-readings', async (req, res) => {
  try {
    const manualReadings = await ReadingHistory.find({}).limit(10).lean();
    const mobileReadings = await Reading.find({}).limit(10).lean();
    
    res.json({
      manualReadings: manualReadings,
      mobileReadings: mobileReadings,
      manualCount: await ReadingHistory.countDocuments(),
      mobileCount: await Reading.countDocuments()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Add this to your server.js and restart

app.get('/api/debug-jafar', async (req, res) => {
  try {
    const manual = await ReadingHistory.find({ dmaId: 'DMA-JFR' }).lean();
    const mobile = await Reading.find({ dmaId: 'DMA-JFR' }).lean();
    
    const allReadings = [
      ...manual.map(r => ({
        point: r.pointName,
        type: r.pointType,
        value: r.readingValue,
        date: r.readingDate,
        source: 'manual'
      })),
      ...mobile.map(r => ({
        point: r.pointName,
        type: r.pointType,
        value: r.meterReading,
        date: r.timestamp,
        source: 'mobile'
      }))
    ];
    
    // Sort by date
    allReadings.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('\n📊 JAFAR DMA ALL READINGS:');
    allReadings.forEach(r => {
      console.log(`${r.point} (${r.type}) | ${r.value} m³ | ${new Date(r.date).toISOString().split('T')[0]} | ${r.source}`);
    });
    
    res.json({
      total: allReadings.length,
      readings: allReadings
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Save manual reading - WITH DEBUG LOGS
app.post('/api/reading-history', async (req, res) => {
  console.log('\n📝 MANUAL READING SAVE REQUEST RECEIVED');
  console.log('Request body:', req.body);
  
  try {
    const { dmaId, pointName, pointType, readingDate, readingValue, meterId, notes } = req.body;
    
    // Validate required fields
    if (!dmaId || !pointName || !pointType || !readingDate || readingValue === undefined) {
      console.log('❌ Missing required fields:', { dmaId, pointName, pointType, readingDate, readingValue });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newReading = new ReadingHistory({ 
      dmaId, 
      pointName, 
      pointType, 
      readingDate: new Date(readingDate), 
      readingValue: parseFloat(readingValue), 
      meterId, 
      notes, 
      source: 'manual' 
    });
    
    await newReading.save();
    
    console.log('✅ Reading saved successfully:', newReading);
    res.status(201).json(newReading);
    
  } catch (error) { 
    console.error('❌ Error saving reading:', error);
    res.status(500).json({ error: error.message }); 
  }
});
// Add this to your server.js before app.listen

app.get('/api/debug-jafar', async (req, res) => {
  try {
    const manual = await ReadingHistory.find({ dmaId: 'DMA-JFR' }).lean();
    const mobile = await Reading.find({ dmaId: 'DMA-JFR' }).lean();
    
    const allReadings = [
      ...manual.map(r => ({
        point: r.pointName,
        type: r.pointType,
        value: r.readingValue,
        date: r.readingDate,
        source: 'manual'
      })),
      ...mobile.map(r => ({
        point: r.pointName,
        type: r.pointType,
        value: r.meterReading,
        date: r.timestamp,
        source: 'mobile'
      }))
    ];
    
    allReadings.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('\n📊 JAFAR DMA READINGS:');
    allReadings.forEach(r => {
      console.log(`${r.point} (${r.type}) | ${r.value} m³ | ${new Date(r.date).toISOString().split('T')[0]} | ${r.source}`);
    });
    
    res.json({
      total: allReadings.length,
      readings: allReadings
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add the endpoint to add March 2026 readings
app.post('/api/add-march-2026-readings', async (req, res) => {
  console.log('\n📝 ADDING MARCH 2026 READINGS TO DATABASE');
  
  try {
    // Delete existing readings for these dates to avoid duplicates
    await ReadingHistory.deleteMany({
      dmaId: 'DMA-JFR',
      readingDate: {
        $in: [
          new Date('2026-02-13'),
          new Date('2026-03-14')
        ]
      }
    });
    
    // Add Bulk Didly readings
    await ReadingHistory.create({
      dmaId: 'DMA-JFR',
      pointName: 'Bulk Didly',
      pointType: 'inlet',
      readingDate: new Date('2026-02-13'),
      readingValue: 45,
      source: 'manual',
      notes: 'Period start reading - Feb 13'
    });
    
    await ReadingHistory.create({
      dmaId: 'DMA-JFR',
      pointName: 'Bulk Didly',
      pointType: 'inlet',
      readingDate: new Date('2026-03-14'),
      readingValue: 67,
      source: 'manual',
      notes: 'Period end reading - Mar 14'
    });
    
    // Add Shemachoch readings
    await ReadingHistory.create({
      dmaId: 'DMA-JFR',
      pointName: 'Shemachoch',
      pointType: 'inlet',
      readingDate: new Date('2026-02-13'),
      readingValue: 10,
      source: 'manual',
      notes: 'Period start reading - Feb 13'
    });
    
    await ReadingHistory.create({
      dmaId: 'DMA-JFR',
      pointName: 'Shemachoch',
      pointType: 'inlet',
      readingDate: new Date('2026-03-14'),
      readingValue: 12,
      source: 'manual',
      notes: 'Period end reading - Mar 14'
    });
    
    // Add Tel outlet readings
    await ReadingHistory.create({
      dmaId: 'DMA-JFR',
      pointName: 'Tel',
      pointType: 'outlet',
      readingDate: new Date('2026-02-13'),
      readingValue: 2,
      source: 'manual',
      notes: 'Period start reading - Feb 13'
    });
    
    await ReadingHistory.create({
      dmaId: 'DMA-JFR',
      pointName: 'Tel',
      pointType: 'outlet',
      readingDate: new Date('2026-03-14'),
      readingValue: 5,
      source: 'manual',
      notes: 'Period end reading - Mar 14'
    });
    
    console.log('✅ March 2026 readings added successfully!');
    
    // Verify they were added
    const verify = await ReadingHistory.find({
      dmaId: 'DMA-JFR',
      readingDate: {
        $in: [
          new Date('2026-02-13'),
          new Date('2026-03-14')
        ]
      }
    }).lean();
    
    console.log('📊 Verified readings in database:');
    verify.forEach(r => {
      console.log(`   ${r.pointName} (${r.pointType}): ${r.readingValue} m³ on ${r.readingDate.toISOString().split('T')[0]}`);
    });
    
    res.json({ 
      message: 'March 2026 readings added successfully!',
      added: verify.length,
      readings: verify
    });
    
  } catch (error) {
    console.error('Error adding readings:', error);
    res.status(500).json({ error: error.message });
  }
});
// ============= WATER BALANCE SUMMARY ENDPOINT =============

app.get('/api/water-balance-summary', async (req, res) => {
  console.log('\n💧 WATER BALANCE SUMMARY CALLED');
  console.log('Query params:', req.query);
  
  try {
    const { periodId } = req.query;
    
    if (!periodId) {
      return res.status(400).json({ error: 'periodId is required' });
    }
    
    // Define periods
    const periods = {
      '2026-march': {
        name: 'March 2026',
        startDate: new Date('2026-02-13'),
        endDate: new Date('2026-03-14'),
        days: 30
      },
      '2026-february': {
        name: 'February 2026',
        startDate: new Date('2026-01-14'),
        endDate: new Date('2026-02-12'),
        days: 30
      },
      '2026-january': {
        name: 'January 2026',
        startDate: new Date('2025-12-15'),
        endDate: new Date('2026-01-13'),
        days: 30
      }
    };
    
    const period = periods[periodId];
    if (!period) {
      return res.status(404).json({ error: `Period ${periodId} not found` });
    }
    
    console.log(`Period: ${period.name}`);
    console.log(`Start: ${period.startDate.toISOString().split('T')[0]}`);
    console.log(`End: ${period.endDate.toISOString().split('T')[0]}`);
    
    // Get all readings for DMA-JFR from both collections
    const manualReadings = await ReadingHistory.find({ dmaId: 'DMA-JFR' }).lean();
    const mobileReadings = await Reading.find({ dmaId: 'DMA-JFR' }).lean();
    
    // Combine readings
    const allReadings = [
      ...manualReadings.map(r => ({
        pointName: r.pointName,
        pointType: r.pointType,
        value: r.readingValue,
        date: new Date(r.readingDate),
        source: 'manual'
      })),
      ...mobileReadings.map(r => ({
        pointName: r.pointName,
        pointType: r.pointType,
        value: r.meterReading,
        date: new Date(r.timestamp),
        source: 'mobile'
      }))
    ];
    
    console.log(`Total readings found: ${allReadings.length}`);
    
    // Group by point name
    const points = {
      'Bulk Didly': { type: 'inlet', readings: [] },
      'Shemachoch': { type: 'inlet', readings: [] },
      'Tel': { type: 'outlet', readings: [] }
    };
    
    allReadings.forEach(r => {
      if (points[r.pointName]) {
        points[r.pointName].readings.push({
          value: r.value,
          date: r.date,
          source: r.source
        });
      }
    });
    
    // Sort readings by date
    Object.keys(points).forEach(key => {
      points[key].readings.sort((a, b) => a.date - b.date);
    });
    
    // Find closest reading to a date
    const findClosest = (readings, targetDate) => {
      if (!readings.length) return null;
      let closest = readings[0];
      let minDiff = Math.abs(closest.date - targetDate);
      
      for (let i = 1; i < readings.length; i++) {
        const diff = Math.abs(readings[i].date - targetDate);
        if (diff < minDiff) {
          minDiff = diff;
          closest = readings[i];
        }
      }
      return closest;
    };
    
    const inletResults = [];
    const outletResults = [];
    
    // Calculate for each point
    for (const [pointName, pointData] of Object.entries(points)) {
      console.log(`\nProcessing ${pointName} (${pointData.type}):`);
      pointData.readings.forEach(r => {
        console.log(`  ${r.source}: ${r.value} on ${r.date.toISOString().split('T')[0]}`);
      });
      
      const startReading = findClosest(pointData.readings, period.startDate);
      const endReading = findClosest(pointData.readings, period.endDate);
      
      if (startReading && endReading) {
        let difference = Math.abs(endReading.value - startReading.value);
        
        console.log(`  Start: ${startReading.value} on ${startReading.date.toISOString().split('T')[0]}`);
        console.log(`  End: ${endReading.value} on ${endReading.date.toISOString().split('T')[0]}`);
        console.log(`  Difference: ${difference} m³`);
        
        if (pointData.type === 'inlet') {
          inletResults.push({ pointName, difference });
        } else {
          outletResults.push({ pointName, difference });
        }
      } else {
        console.log(`  ⚠️ Missing readings for ${pointName}`);
      }
    }
    
    const totalInlet = inletResults.reduce((sum, i) => sum + i.difference, 0);
    const totalOutlet = outletResults.reduce((sum, i) => sum + i.difference, 0);
    const systemInflow = totalInlet - totalOutlet;
    
    console.log(`\n📊 RESULTS:`);
    console.log(`Total Inlet: ${totalInlet} m³`);
    console.log(`Total Outlet: ${totalOutlet} m³`);
    console.log(`System Inflow: ${systemInflow} m³`);
    
    res.json({
      dmas: [{
        dmaId: 'DMA-JFR',
        dmaName: 'Jafar DMA',
        totalInlet: totalInlet,
        totalOutlet: totalOutlet,
        systemInflow: systemInflow,
        period: {
          name: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          days: period.days
        },
        inletDetails: inletResults,
        outletDetails: outletResults
      }]
    });
    
  } catch (error) {
    console.error('Error in water-balance-summary:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});
// ============= START SERVER =============
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Water Utility Backend running on port ${PORT}`);
  console.log('📊 API available at http://localhost:' + PORT + '/api');
  console.log('🗄️  Database: MongoDB');
  console.log('\n📌 Available endpoints:');
  console.log('   GET  /api/health');
  console.log('   GET  /api/test');
  console.log('   GET  /api/test-endpoints');
  console.log('   GET  /api/bulk-readings');
  console.log('   POST /api/bulk-readings');
  console.log('   GET  /api/months');
  console.log('   GET  /api/customers');
  console.log('   GET  /api/reading-history');
  console.log('   GET  /api/dma/history\n');
});