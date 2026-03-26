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
    'https://dmadashboard.netlify.app',
    'https://water-utility-backend.onrender.com'
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
// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
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

// Health check - should be at the top
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Water Utility Backend is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString()
  });
});

// Months endpoint
// ============= CUSTOMER DATA ENDPOINTS =============

// Get available months from customer data
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
    console.error('Error fetching months:', error);
    res.json([]);
  }
});

// Get customers by DMA with pagination
app.get('/api/customers', async (req, res) => {
  try {
    const { dmaId, month, year, minConsumption, zeroConsumption, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log(`🔍 Query: dmaId=${dmaId}, month=${month}, year=${year}, page=${page}`);
    
    let allCustomers = await Customer.find({}).lean();
    let dmaCustomers = allCustomers.filter(c => determineDMA(c.latitude, c.longitude) === dmaId);
    
    let customersWithData = [];
    let totalMonthConsumption = 0;
    
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      customersWithData = dmaCustomers.filter(c => {
        const bill = c.billingHistory.find(b => b.month === monthNum && b.year === yearNum);
        if (bill) {
          c.currentConsumption = bill.consumption;
          c.currentBill = bill.billAmount;
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
    const avgConsumption = totalCustomers > 0 
      ? filtered.reduce((sum, c) => sum + (c.currentConsumption || 0), 0) / totalCustomers 
      : 0;
    
    const customersWithChanges = paginatedCustomers.map(c => {
      const meterKeys = c.billingHistory.map(b => b.meterKey).filter(k => k);
      const uniqueKeys = [...new Set(meterKeys)];
      return {
        id: c.custKey,
        name: c.name,
        meterNumber: c.meterKey,
        currentConsumption: c.currentConsumption || 0,
        currentBill: c.currentBill || 0,
        status: 'active',
        meterKeyChanged: uniqueKeys.length > 1,
        meterKeys: uniqueKeys
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
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
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

app.post('/api/bulk-readings', async (req, res) => {
  try {
    const { dmaId, pointName, meterReading, timestamp, date, size, notes, latitude, longitude, pointType = 'inlet', userId, userName } = req.body;
    
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
    
    const newReading = { id: Date.now(), dmaId, pointName, meterReading: parseFloat(meterReading), timestamp: timestamp || new Date().toISOString(), date: date || new Date().toISOString().split('T')[0], size: size || 'Unknown', notes: notes || '', latitude: latitude || null, longitude: longitude || null, pointType, source: 'mobile', receivedAt: new Date().toISOString() };
    bulkReadings.push(newReading);
    
    res.status(201).json({ message: 'Reading saved successfully', id: reading._id, reading });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save reading' });
  }
});

app.get('/api/bulk-readings/:dmaId/:pointName/latest', async (req, res) => {
  try {
    const { dmaId, pointName } = req.params;
    const reading = await Reading.findOne({ dmaId, pointName }).sort({ timestamp: -1 });
    reading ? res.json(reading) : res.status(404).json({ message: 'No readings found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reading' });
  }
});

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

app.get('/api/bulk-readings', (req, res) => { res.json(bulkReadings); });
app.get('/api/bulk-readings/:dmaId', (req, res) => {
  const { dmaId } = req.params;
  res.json(bulkReadings.filter(r => r.dmaId === dmaId));
});

app.post('/api/nrw/calculate', (req, res) => {
  const systemInput = parseFloat(req.body.systemInput) || 950000;
  const billedConsumption = parseFloat(req.body.billedConsumption) || 775000;
  const nrwVolume = systemInput - billedConsumption;
  const nrwPercentage = (nrwVolume / systemInput * 100).toFixed(2);
  
  res.json({ nrwPercentage, nrwVolume, components: { leaks: nrwVolume * 0.4, meterInaccuracies: nrwVolume * 0.3, unauthorizedConsumption: nrwVolume * 0.2, bursts: nrwVolume * 0.1 }, financial: { costPerUnit: 0.85, totalLossValue: (nrwVolume * 0.85).toFixed(2), potentialSavings: (nrwVolume * 0.85 * 0.4).toFixed(2) }, recommendations: ["Implement pressure management", "Schedule meter accuracy testing", "Conduct leak detection survey", "Review unauthorized consumption cases"] });
});

app.post('/api/bill/extract', async (req, res) => {
  try {
    const response = await axios.post('http://197.156.64.238:5001/extract', req.body, { timeout: 3000, validateStatus: false }).catch(() => null);
    response && response.data ? res.json(response.data) : res.json({ billNumber: req.body.billNumber || 'BILL-2024-001', meterNumber: req.body.meterNumber || 'MTR-2024-001', customerId: req.body.customerId || 'CUST-001', billingPeriod: 'December 2024', issueDate: '2024-12-01', dueDate: '2025-01-05', previousReading: 642, currentReading: 686, consumption: 44, rate: 1.425, charges: { waterCharge: 44.00, sewerCharge: 13.20, serviceCharge: 5.50, total: 62.70 }, paymentStatus: 'Pending', meterStatus: 'Normal' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract bill data', details: error.message });
  }
});

app.get('/api/analytics/overview', (req, res) => {
  res.json({ totalCustomers: 6780, activeMeters: 6485, monthlyConsumption: 723400, nrwAverage: 18.5, revenueYTD: 892450, collectionRate: 94.2, customerSatisfaction: 4.2, trends: { customers: '+5.2%', consumption: '+3.1%', revenue: '+7.4%', nrw: '-2.1%' } });
});

app.get('/api/shapefile/:dmaId', (req, res) => { res.json({ message: `Shapefile for ${req.params.dmaId} would be served here`, dmaId: req.params.dmaId }); });
app.get('/api/test', (req, res) => { res.json({ status: 'OK', message: 'Backend test endpoint is working', time: new Date().toISOString() }); });

// ============= CUSTOMER DATA ENDPOINTS =============


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
        if (bill) { c.currentConsumption = bill.consumption; c.currentBill = bill.billAmount; totalMonthConsumption += bill.consumption; return true; }
        return false;
      });
    } else { customersWithData = dmaCustomers; }
    
    let filtered = customersWithData;
    if (minConsumption) { const min = parseFloat(minConsumption); filtered = filtered.filter(c => (c.currentConsumption || 0) >= min); }
    if (zeroConsumption === 'true') { filtered = filtered.filter(c => (c.currentConsumption || 0) === 0); }
    
    const totalCount = filtered.length;
    const paginatedCustomers = filtered.slice(skip, skip + parseInt(limit));
    const totalCustomers = filtered.length;
    const zeroConsumptionCount = filtered.filter(c => (c.currentConsumption || 0) === 0).length;
    const highConsumptionCount = filtered.filter(c => (c.currentConsumption || 0) > 100).length;
    const avgConsumption = totalCustomers > 0 ? filtered.reduce((sum, c) => sum + (c.currentConsumption || 0), 0) / totalCustomers : 0;
    
    const customersWithChanges = paginatedCustomers.map(c => {
      const meterKeys = c.billingHistory.map(b => b.meterKey).filter(k => k);
      const uniqueKeys = [...new Set(meterKeys)];
      return { id: c.custKey, name: c.name, meterNumber: c.meterKey, currentConsumption: c.currentConsumption || 0, currentBill: c.currentBill || 0, status: 'active', meterKeyChanged: uniqueKeys.length > 1, meterKeys: uniqueKeys };
    });
    
    res.json({ customers: customersWithChanges, stats: { totalCustomers, zeroConsumption: zeroConsumptionCount, highConsumption: highConsumptionCount, averageConsumption: avgConsumption, totalConsumption: totalMonthConsumption }, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalCount / parseInt(limit)), totalItems: totalCount, itemsPerPage: parseInt(limit) } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/customers/:customerId/history', async (req, res) => {
  try {
    const customer = await Customer.findOne({ custKey: req.params.customerId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const sortedHistory = [...customer.billingHistory].sort((a, b) => { if (a.year !== b.year) return a.year - b.year; return a.month - b.month; });
    const meterKeys = sortedHistory.map(b => b.meterKey).filter(k => k);
    const uniqueKeys = [...new Set(meterKeys)];
    res.json({ customer: { id: customer.custKey, name: customer.name, meterNumber: customer.meterKey, address: customer.address, meterKeyChanged: uniqueKeys.length > 1, meterKeys: uniqueKeys }, history: sortedHistory.map(bill => ({ period: bill.period, month: bill.month, year: bill.year, consumption: bill.consumption || 0, billAmount: bill.billAmount || 0, totalAmount: bill.totalAmount || 0, meterKey: bill.meterKey })) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/all-customers', async (req, res) => {
  try {
    const total = await Customer.countDocuments();
    const withCoords = await Customer.countDocuments({ latitude: { $ne: null } });
    res.json({ total, withCoordinates: withCoords });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/debug-jafar', async (req, res) => {
  try {
    let allCustomers = await Customer.find({});
    const jafarCustomers = allCustomers.filter(c => determineDMA(c.latitude, c.longitude) === 'DMA-JFR');
    const monthlyCounts = {}, monthlyConsumption = {};
    for (let month = 1; month <= 12; month++) {
      for (let year of [2025, 2026]) {
        let count = 0, totalCons = 0;
        jafarCustomers.forEach(c => {
          const bill = c.billingHistory.find(b => b.month === month && b.year === year);
          if (bill) { count++; totalCons += bill.consumption; }
        });
        if (count > 0) { monthlyCounts[`${month}/${year}`] = count; monthlyConsumption[`${month}/${year}`] = totalCons; }
      }
    }
    res.json({ totalJafarCustomers: jafarCustomers.length, monthlyCounts, monthlyConsumption });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/test-dma', async (req, res) => {
  try {
    const sample = await Customer.findOne({ latitude: { $ne: null }, longitude: { $ne: null } });
    if (!sample) return res.json({ error: 'No customers with coordinates' });
    const point = turf.point([sample.longitude, sample.latitude]);
    res.json({ customer: { custKey: sample.custKey, name: sample.name, lat: sample.latitude, lng: sample.longitude }, inJafar: turf.booleanPointInPolygon(point, jafarPolygon), inYeka: turf.booleanPointInPolygon(point, yekaPolygon) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============= READING HISTORY ENDPOINTS =============

app.get('/api/reading-history', async (req, res) => {
  try {
    let allReadings = [];
    try {
      const manualReadings = await ReadingHistory.find().sort({ readingDate: -1 }).lean();
      allReadings.push(...manualReadings.map(r => ({ ...r, source: 'manual' })));
    } catch (err) {}
    try {
      const mobileReadings = await Reading.find({}).sort({ timestamp: -1 }).lean();
      allReadings.push(...mobileReadings.map(r => ({ _id: r._id, dmaId: r.dmaId, pointName: r.pointName, pointType: r.pointType || 'inlet', readingDate: r.timestamp, readingValue: r.meterReading, meterId: r.meterId || 'Mobile App', notes: r.notes || 'Mobile reading', source: 'mobile', createdAt: r.createdAt })));
    } catch (err) {}
    allReadings.sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));
    res.json(allReadings);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

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
      allReadings.push(...mobileReadings.map(r => ({ _id: r._id, dmaId: r.dmaId, pointName: r.pointName, pointType: r.pointType || 'inlet', readingDate: r.timestamp, readingValue: r.meterReading, meterId: r.meterId || 'Mobile App', notes: r.notes || 'Mobile reading', source: 'mobile', createdAt: r.createdAt })));
    } catch (err) {}
    allReadings.sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));
    res.json(allReadings);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/reading-history', async (req, res) => {
  try {
    const { dmaId, pointName, pointType, readingDate, readingValue, meterId, notes } = req.body;
    const newReading = new ReadingHistory({ dmaId, pointName, pointType, readingDate: new Date(readingDate), readingValue: parseFloat(readingValue), meterId, notes, source: 'manual' });
    await newReading.save();
    res.status(201).json(newReading);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/reading-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dmaId, pointName, pointType, readingDate, readingValue, meterId, notes } = req.body;
    const updated = await ReadingHistory.findByIdAndUpdate(id, { dmaId, pointName, pointType, readingDate: new Date(readingDate), readingValue: parseFloat(readingValue), meterId, notes, updatedAt: new Date() }, { new: true });
    res.json(updated);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/reading-history/:id', async (req, res) => {
  try {
    await ReadingHistory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reading deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============= WATER BALANCE ENDPOINTS =============

app.get('/api/dma/system-inflow/:dmaId', async (req, res) => {
  try {
    const { dmaId } = req.params;
    const { year, month } = req.query;
    const targetYear = parseInt(year), targetMonth = parseInt(month);
    const currentDate = getScheduledReadingDate(targetYear, targetMonth);
    let prevMonth = targetMonth - 1, prevYear = targetYear;
    if (prevMonth === 0) { prevMonth = 12; prevYear = targetYear - 1; }
    const previousDate = getScheduledReadingDate(prevYear, prevMonth);
    
    const dmaConfig = DMA_POINTS[dmaId];
    if (!dmaConfig) return res.status(404).json({ error: 'DMA not found' });
    
    let totalInflow = 0, totalOutflow = 0, hasEstimates = false;
    const inletDetails = [], outletDetails = [];
    
    for (const inlet of dmaConfig.inlets) {
      const prevReading = await findClosestReading(dmaId, inlet.name, previousDate);
      const currReading = await findClosestReading(dmaId, inlet.name, currentDate);
      if (!prevReading || !currReading) { inletDetails.push({ name: inlet.name, error: 'Insufficient readings', quality: 'missing' }); hasEstimates = true; continue; }
      const consumption = calculateConsumption(prevReading, currReading, previousDate, currentDate);
      totalInflow += consumption.proRatedConsumption;
      inletDetails.push({ name: inlet.name, previousReading: { scheduledDate: previousDate, actualDate: prevReading.reading.readingDate, value: prevReading.reading.readingValue, daysOffset: prevReading.daysDifference }, currentReading: { scheduledDate: currentDate, actualDate: currReading.reading.readingDate, value: currReading.reading.readingValue, daysOffset: currReading.daysDifference }, consumption: consumption.proRatedConsumption, quality: consumption.quality });
      if (consumption.quality !== 'good') hasEstimates = true;
    }
    
    for (const outlet of dmaConfig.outlets) {
      const prevReading = await findClosestReading(dmaId, outlet.name, previousDate);
      const currReading = await findClosestReading(dmaId, outlet.name, currentDate);
      if (!prevReading || !currReading) { outletDetails.push({ name: outlet.name, error: 'Insufficient readings', quality: 'missing' }); hasEstimates = true; continue; }
      const consumption = calculateConsumption(prevReading, currReading, previousDate, currentDate);
      totalOutflow += consumption.proRatedConsumption;
      outletDetails.push({ name: outlet.name, previousReading: { scheduledDate: previousDate, actualDate: prevReading.reading.readingDate, value: prevReading.reading.readingValue, daysOffset: prevReading.daysDifference }, currentReading: { scheduledDate: currentDate, actualDate: currReading.reading.readingDate, value: currReading.reading.readingValue, daysOffset: currReading.daysDifference }, consumption: consumption.proRatedConsumption, quality: consumption.quality });
      if (consumption.quality !== 'good') hasEstimates = true;
    }
    
    res.json({ dmaId, dmaName: dmaConfig.name, period: { year: targetYear, month: targetMonth, startDate: previousDate, endDate: currentDate, days: (currentDate - previousDate) / (1000 * 60 * 60 * 24) }, systemInflow: { total: Math.round(totalInflow), details: inletDetails }, systemOutflow: { total: Math.round(totalOutflow), details: outletDetails }, netInflow: Math.round(totalInflow - totalOutflow), dataQuality: { hasEstimates, message: hasEstimates ? 'Some readings were estimated due to missing data' : 'All readings are exact' } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/dma/water-balance-summary', async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = parseInt(year), targetMonth = parseInt(month);
    const currentDate = getScheduledReadingDate(targetYear, targetMonth);
    let prevMonth = targetMonth - 1, prevYear = targetYear;
    if (prevMonth === 0) { prevMonth = 12; prevYear = targetYear - 1; }
    const previousDate = getScheduledReadingDate(prevYear, prevMonth);
    
    const results = [];
    for (const [dmaId, dmaConfig] of Object.entries(DMA_POINTS)) {
      let totalInflow = 0, totalOutflow = 0;
      for (const inlet of dmaConfig.inlets) {
        const prevReading = await findClosestReading(dmaId, inlet.name, previousDate);
        const currReading = await findClosestReading(dmaId, inlet.name, currentDate);
        if (prevReading && currReading) {
          const actualDays = (currReading.reading.readingDate - prevReading.reading.readingDate) / (1000 * 60 * 60 * 24);
          const dailyRate = (currReading.reading.readingValue - prevReading.reading.readingValue) / actualDays;
          const scheduledDays = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
          totalInflow += dailyRate * scheduledDays;
        }
      }
      for (const outlet of dmaConfig.outlets) {
        const prevReading = await findClosestReading(dmaId, outlet.name, previousDate);
        const currReading = await findClosestReading(dmaId, outlet.name, currentDate);
        if (prevReading && currReading) {
          const actualDays = (currReading.reading.readingDate - prevReading.reading.readingDate) / (1000 * 60 * 60 * 24);
          const dailyRate = (currReading.reading.readingValue - prevReading.reading.readingValue) / actualDays;
          const scheduledDays = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
          totalOutflow += dailyRate * scheduledDays;
        }
      }
      results.push({ dmaId, dmaName: dmaConfig.name, inflow: Math.round(totalInflow), outflow: Math.round(totalOutflow), netInflow: Math.round(totalInflow - totalOutflow) });
    }
    res.json({ period: `${month}/${year}`, dmas: results });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/debug-mobile-readings', async (req, res) => {
  try {
    const totalCount = await Reading.countDocuments();
    const allMobileReadings = await Reading.find().sort({ timestamp: -1 }).limit(20);
    const grouped = {};
    allMobileReadings.forEach(r => {
      const key = `${r.dmaId}-${r.pointName}`;
      if (!grouped[key]) { grouped[key] = { dmaId: r.dmaId, pointName: r.pointName, pointType: r.pointType, count: 0, samples: [] }; }
      grouped[key].count++;
      if (grouped[key].samples.length < 3) { grouped[key].samples.push({ value: r.meterReading, date: r.timestamp, source: r.source }); }
    });
    res.json({ totalMobileReadings: totalCount, availablePoints: grouped, sampleReadings: allMobileReadings.map(r => ({ dmaId: r.dmaId, pointName: r.pointName, pointType: r.pointType, readingValue: r.meterReading, timestamp: r.timestamp })) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============= START SERVER =============
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Water Utility Backend running on port ${PORT}`);
  console.log('📊 API available at http://localhost:' + PORT + '/api');
  console.log('🗄️  Database: MongoDB');
});