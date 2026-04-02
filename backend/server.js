const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const turf = require('@turf/turf');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'water-utility-secret-key-2026';

// ============= DATABASE CONNECTION =============
// ============= DATABASE CONNECTION =============
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/water-utility';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
connectDB();

// ============= MIDDLEWARE =============
// ============= MIDDLEWARE =============
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://dmadashboard.netlify.app',
    'https://bulk-meter-mobile.onrender.com'
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

// ============= USER SCHEMA =============
// Clear any existing model
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  password: { type: String, required: true },
  dmaAccess: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isFirstLogin: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Audit Log Schema
if (mongoose.models.AuditLog) {
  delete mongoose.models.AuditLog;
}

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  action: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// ============= AUTHENTICATION MIDDLEWARE =============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ============= DMA BOUNDARIES =============
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

const jafarPolygon = turf.polygon([jafarPoints.map(p => [p[1], p[0]])]);
const yekaPolygon = turf.polygon([yekaPoints.map(p => [p[1], p[0]])]);

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

const Customer = mongoose.model('Customer', CustomerSchema);

// ============= READING MODELS =============
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

const ReadingHistory = mongoose.models.ReadingHistory || mongoose.model('ReadingHistory', ReadingHistorySchema);

// ============= CALENDAR PERIODS =============
const CALENDAR_PERIODS = {
  '2026-january': { id: '2026-january', name: 'January 2026', month: 'january', year: 2026, startDate: '2025-12-15', endDate: '2026-01-13', days: 30 },
  '2026-february': { id: '2026-february', name: 'February 2026', month: 'february', year: 2026, startDate: '2026-01-14', endDate: '2026-02-12', days: 30 },
  '2026-march': { id: '2026-march', name: 'March 2026', month: 'march', year: 2026, startDate: '2026-02-13', endDate: '2026-03-14', days: 30 },
  '2026-april': { id: '2026-april', name: 'April 2026', month: 'april', year: 2026, startDate: '2026-03-14', endDate: '2026-04-13', days: 31 }
};

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============= AUTHENTICATION ENDPOINTS =============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is disabled' });
    }
    
    let isPasswordValid = false;
    if (password === 'AAWSA') {
      isPasswordValid = true;
      if (user.isFirstLogin) {
        return res.status(200).json({ requirePasswordChange: true, userId: user._id });
      }
    } else {
      isPasswordValid = await bcrypt.compare(password, user.password);
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const tokenExpiry = rememberMe ? '7d' : '24h';
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role, fullName: user.name, dmaAccess: user.dmaAccess },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );
    
    res.json({ success: true, token, user: { id: user._id, username: user.username, fullName: user.name, role: user.role, dmaAccess: user.dmaAccess, isFirstLogin: user.isFirstLogin } });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, userId } = req.body;
    
    // For first login, we might not have token, so accept userId from body
    let user;
    if (req.user) {
      user = await User.findById(req.user.userId);
    } else if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let isValid = false;
    if (currentPassword === 'AAWSA' && user.isFirstLogin) {
      isValid = true;
    } else {
      isValid = await bcrypt.compare(currentPassword, user.password);
    }
    
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isFirstLogin = false;
    await user.save();
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ id: user._id, username: user.username, fullName: user.name, role: user.role, dmaAccess: user.dmaAccess, isFirstLogin: user.isFirstLogin });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  res.json({ success: true });
});

// ============= TEST ENDPOINTS =============
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Water Utility Backend is running', time: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// ============= DMA HISTORY =============
app.get('/api/dma/history', authenticateToken, async (req, res) => {
  const zones = [
    { id: 'DMA-JFR', name: 'Jafar DMA', inlets: [{ name: 'Bulk Didly' }, { name: 'Shemachoch' }], outlets: [{ name: 'Tel' }] },
    { id: 'DMA-YKA', name: 'Yeka DMA', inlets: [{ name: 'Misrak' }, { name: 'English' }, { name: 'Wubet' }], outlets: [] }
  ];
  res.json({ zones, history: [] });
});

// ============= CUSTOMER ENDPOINTS =============
app.get('/api/months', async (req, res) => {
  try {
    const months = await Customer.aggregate([
      { $unwind: '$billingHistory' },
      { $group: { _id: { month: '$billingHistory.month', year: '$billingHistory.year' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formatted = months.map(m => ({ month: m._id.month, year: m._id.year, label: `${monthNames[m._id.month - 1]} ${m._id.year}`, count: m.count }));
    res.json(formatted);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { dmaId, month, year, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let allCustomers = await Customer.find({}).lean();
    let dmaCustomers = allCustomers.filter(c => determineDMA(c.latitude, c.longitude) === dmaId);
    let customersWithData = [];
    let totalMonthConsumption = 0;
    
    if (month && year) {
      const monthNum = parseInt(month), yearNum = parseInt(year);
      customersWithData = dmaCustomers.filter(c => {
        const bill = c.billingHistory.find(b => b.month === monthNum && b.year === yearNum);
        if (bill) { c.currentConsumption = bill.consumption; totalMonthConsumption += bill.consumption; return true; }
        return false;
      });
    } else { customersWithData = dmaCustomers; }
    
    const paginatedCustomers = customersWithData.slice(skip, skip + parseInt(limit));
    const customersWithChanges = paginatedCustomers.map(c => ({ id: c.custKey, name: c.name, meterNumber: c.meterKey, currentConsumption: c.currentConsumption || 0, status: 'active' }));
    
    res.json({ customers: customersWithChanges, stats: { totalCustomers: customersWithData.length, totalConsumption: totalMonthConsumption } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============= READING HISTORY ENDPOINTS =============
app.get('/api/reading-history', authenticateToken, async (req, res) => {
  try {
    const manualReadings = await ReadingHistory.find().sort({ readingDate: -1 }).lean();
    const mobileReadings = await Reading.find().sort({ timestamp: -1 }).lean();
    let allReadings = [...manualReadings.map(r => ({ ...r, source: 'manual' })), ...mobileReadings.map(r => ({ _id: r._id, dmaId: r.dmaId, pointName: r.pointName, pointType: r.pointType || 'inlet', readingDate: r.timestamp, readingValue: r.meterReading, source: 'mobile' }))];
    allReadings.sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));
    res.json(allReadings);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/reading-history', authenticateToken, requireRole(['admin', 'engineer']), async (req, res) => {
  try {
    const { dmaId, pointName, pointType, readingDate, readingValue } = req.body;
    const newReading = new ReadingHistory({ dmaId, pointName, pointType, readingDate: new Date(readingDate), readingValue: parseFloat(readingValue), source: 'manual' });
    await newReading.save();
    res.status(201).json(newReading);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============= WATER BALANCE ENDPOINT =============
app.get('/api/available-periods', (req, res) => {
  const periods = Object.values(CALENDAR_PERIODS).map(period => ({ id: period.id, label: `${period.name}`, name: period.name, year: period.year, month: period.month, startDate: period.startDate, endDate: period.endDate, days: period.days }));
  res.json({ periods });
});

app.get('/api/water-balance-summary', authenticateToken, async (req, res) => {
  const { periodId } = req.query;
  const period = CALENDAR_PERIODS[periodId];
  if (!period) return res.status(404).json({ error: 'Period not found' });
  
  res.json({ dmas: [{ dmaId: 'DMA-JFR', dmaName: 'Jafar DMA', totalInlet: 0, totalOutlet: 0, systemInflow: 0, period }] });
});

// ============= NRW CALCULATOR =============
app.post('/api/nrw/calculate', authenticateToken, async (req, res) => {
  const { periodId } = req.body;
  const period = CALENDAR_PERIODS[periodId];
  if (!period) return res.status(404).json({ error: 'Period not found' });
  
  const [year, monthName] = periodId.split('-');
  const monthMap = { 'january': 1, 'february': 2, 'march': 3, 'april': 4 };
  const customerMonth = monthMap[monthName];
  const customerYear = parseInt(year);
  
  // Get customer data
  let totalBilled = 0;
  let totalCustomers = 0;
  try {
    const allCustomers = await Customer.find({}).lean();
    const dmaCustomers = allCustomers.filter(c => determineDMA(c.latitude, c.longitude) === 'DMA-JFR');
    totalCustomers = dmaCustomers.length;
    dmaCustomers.forEach(customer => {
      const bill = customer.billingHistory?.find(b => b.month === customerMonth && b.year === customerYear);
      if (bill && bill.consumption) totalBilled += bill.consumption;
    });
  } catch (error) { console.error('Error getting customer data:', error); }
  
  res.json({
    period: { id: periodId, name: period.name },
    dmNRW: [{ dmaId: 'DMA-JFR', dmaName: 'Jafar DMA', systemInput: 0, billedConsumption: totalBilled, nrwVolume: -totalBilled, nrwPercentage: 0, customerCount: totalCustomers, activeMeters: 0 }],
    total: { systemInput: 0, billedConsumption: totalBilled, nrwVolume: -totalBilled, nrwPercentage: 0, totalCustomers: totalCustomers, totalActiveMeters: 0 }
  });
});

// ============= ANALYTICS =============
app.get('/api/analytics/overview', (req, res) => {
  res.json({ totalCustomers: 43090, activeMeters: 43090, monthlyConsumption: 425000, nrwAverage: 18.5 });
});

// ============= DEBUG ENDPOINTS =============
app.get('/api/debug-customer-structure', async (req, res) => {
  const totalCustomers = await Customer.countDocuments();
  res.json({ totalCustomers });
});

// ============= INITIALIZE DEFAULT USERS =============
// ============= INITIALIZE DEFAULT USERS =============
const initializeDefaultUsers = async () => {
  try {
    // Check if User model exists
    if (!mongoose.models.User) {
      console.log('User model not ready');
      return;
    }
    
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`✅ Users already exist (${userCount} users).`);
      return;
    }
    
    const payrollUsers = [
      { username: '42609', name: 'Engineer 42609', role: 'engineer' },
      { username: '76651', name: 'Engineer 76651', role: 'admin' },
      { username: '77232', name: 'Engineer 77232', role: 'engineer' },
      { username: '89371', name: 'Engineer 89371', role: 'engineer' },
      { username: '76678', name: 'Engineer 76678', role: 'engineer' },
      { username: '62812', name: 'Technician 62812', role: 'technician' },
      { username: 'admin', name: 'System Administrator', role: 'admin' }
    ];
    
    for (const userData of payrollUsers) {
      const hashedPassword = await bcrypt.hash('AAWSA', 10);
      await User.create({
        username: userData.username,
        name: userData.name,
        email: `${userData.username}@waterutility.com`,
        role: userData.role,
        password: hashedPassword,
        isFirstLogin: true,
        dmaAccess: ['DMA-JFR', 'DMA-YKA']
      });
      console.log(`✅ User created: ${userData.username} (${userData.role})`);
    }
    console.log('✅ All payroll users initialized');
  } catch (error) {
    console.error('Error creating default users:', error);
  }
};

// Call this after database connection
setTimeout(() => {
  initializeDefaultUsers();
}, 3000);

// ============= START SERVER =============
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n✅ Water Utility Backend running on port ${PORT}`);
  console.log('📊 API available at http://localhost:' + PORT + '/api');
  console.log('🗄️  Database: MongoDB');
  
  // Initialize users after server starts
  setTimeout(() => initializeDefaultUsers(), 2000);
});