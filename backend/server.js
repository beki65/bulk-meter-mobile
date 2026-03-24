const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const readingRoutes = require('./routes/readings');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware - MUST be BEFORE any routes
// CORS configuration - Allow Capacitor app
// CORS configuration - Allow Capacitor app
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'capacitor://localhost',
    'ionic://localhost',
    'https://localhost',          // 👈 CRITICAL for Capacitor 6
    'http://localhost',
    'https://bulk-meter-mobile.onrender.com'    // Your actual Render URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Enable preflight requests for all routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Log all requests (after body parsing)
app.use((req, res, next) => {
    console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request body:', req.body); // Add this to see if body is received
    next();
});

// ============= API ROUTES =============

// Auth routes
app.use('/api/auth', authRoutes);

// Reading routes (MongoDB version)
app.use('/api/readings', readingRoutes);

// ============= LEGACY ENDPOINTS (for backward compatibility) =============

// In-memory storage for backward compatibility
let bulkReadings = [];

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Water Utility Backend is running',
        database: 'MongoDB Connected',
        port: process.env.PORT || 8000,
        time: new Date().toISOString(),
        endpoints: [
            '/api/health',
            '/api/dma/history',
            '/api/nrw/calculate',
            '/api/customers/history/:id',
            '/api/bill/extract',
            '/api/analytics/overview',
            '/api/bulk-readings',
            '/api/bulk-readings/:dmaId',
            '/api/bulk-readings/:dmaId/:pointName/latest',
            '/api/bulk-readings/:dmaId/:pointName/history',
            '/api/auth/login',
            '/api/auth/register',
            '/api/readings'
        ]
    });
});

// Legacy DMA history (now uses MongoDB via readingRoutes)
app.get('/api/dma/history', async (req, res) => {
    try {
        // Forward to reading routes or implement directly
        const Reading = require('./models/Reading');
        
        const getLatestReading = async (dmaId, pointName) => {
            const reading = await Reading.findOne({ dmaId, pointName })
                .sort({ timestamp: -1 });
            
            return reading ? {
                value: reading.meterReading,
                timestamp: reading.timestamp,
                type: reading.pointType
            } : null;
        };

        const zones = [
            {
                id: 'DMA-JFR',
                name: 'Jafar DMA',
                inlets: [
                    { 
                        name: 'Bulk Didly', 
                        flowRate: null, 
                        lastReading: await getLatestReading('DMA-JFR', 'Bulk Didly'),
                        status: (await getLatestReading('DMA-JFR', 'Bulk Didly')) ? 'active' : 'pending' 
                    },
                    { 
                        name: 'Shemachoch', 
                        flowRate: null, 
                        lastReading: await getLatestReading('DMA-JFR', 'Shemachoch'),
                        status: (await getLatestReading('DMA-JFR', 'Shemachoch')) ? 'active' : 'pending' 
                    }
                ],
                outlets: [
                    { 
                        name: 'Tel', 
                        flowRate: null, 
                        lastReading: await getLatestReading('DMA-JFR', 'Tel'),
                        status: (await getLatestReading('DMA-JFR', 'Tel')) ? 'active' : 'pending' 
                    }
                ],
                totalConnections: null,
                activeMeters: null,
                pressure: null,
                efficiency: null,
                status: 'pending'
            },
            {
                id: 'DMA-YKA',
                name: 'Yeka DMA',
                inlets: [
                    { 
                        name: 'Misrak', 
                        flowRate: null, 
                        lastReading: await getLatestReading('DMA-YKA', 'Misrak'),
                        status: (await getLatestReading('DMA-YKA', 'Misrak')) ? 'active' : 'pending' 
                    },
                    { 
                        name: 'English', 
                        flowRate: null, 
                        lastReading: await getLatestReading('DMA-YKA', 'English'),
                        status: (await getLatestReading('DMA-YKA', 'English')) ? 'active' : 'pending' 
                    },
                    { 
                        name: 'Wubet', 
                        flowRate: null, 
                        lastReading: await getLatestReading('DMA-YKA', 'Wubet'),
                        status: (await getLatestReading('DMA-YKA', 'Wubet')) ? 'active' : 'pending' 
                    }
                ],
                outlets: [],
                totalConnections: null,
                activeMeters: null,
                pressure: null,
                efficiency: null,
                status: 'pending'
            },
            {
                id: 'DMA-2019',
                name: '2019 DMA',
                inlets: [
                    { 
                        name: 'Inlet 1', 
                        flowRate: null, 
                        lastReading: await getLatestReading('DMA-2019', 'Inlet 1'),
                        status: (await getLatestReading('DMA-2019', 'Inlet 1')) ? 'active' : 'unknown' 
                    },
                    { 
                        name: 'Inlet 2', 
                        flowRate: null, 
                        lastReading: await getLatestReading('DMA-2019', 'Inlet 2'),
                        status: (await getLatestReading('DMA-2019', 'Inlet 2')) ? 'active' : 'unknown' 
                    }
                ],
                outlets: [],
                totalConnections: null,
                activeMeters: null,
                pressure: null,
                efficiency: null,
                status: 'unknown',
                notes: 'Data pending - survey required'
            }
        ];

        res.json({ zones, history: [] });
    } catch (error) {
        console.error('Error in DMA history:', error);
        res.status(500).json({ error: 'Failed to fetch DMA history' });
    }
});

// Legacy bulk-readings endpoint (now uses MongoDB)
app.post('/api/bulk-readings', async (req, res) => {
    try {
        const Reading = require('./models/Reading');
        
        console.log('📥 POST /api/bulk-readings - Received:', req.body);
        
        const { 
            dmaId, 
            pointName,
            meterReading, 
            timestamp, 
            date,
            size, 
            notes, 
            latitude, 
            longitude,
            pointType = 'inlet',
            userId,
            userName
        } = req.body;
        
        // Validate required fields
        if (!dmaId || !pointName || meterReading === undefined) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['dmaId', 'pointName', 'meterReading']
            });
        }
        
        const reading = new Reading({
            dmaId,
            pointName,
            meterReading: parseFloat(meterReading),
            timestamp: timestamp || new Date(),
            date: date || new Date().toISOString().split('T')[0],
            size: size || 'Unknown',
            notes: notes || '',
            latitude: latitude || null,
            longitude: longitude || null,
            pointType,
            source: 'mobile',
            userId,
            userName
        });
        
        await reading.save();
        
        // Also save to in-memory for backward compatibility
        const newReading = {
            id: Date.now(),
            dmaId,
            pointName,
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
        
        console.log(`✅ Saved to MongoDB: ${dmaId} - ${pointName} (${pointType}) = ${meterReading} m³`);
        console.log(`📊 Total in-memory readings: ${bulkReadings.length}`);
        
        res.status(201).json({
            message: 'Reading saved successfully',
            id: reading._id,
            reading
        });
    } catch (error) {
        console.error('Error saving reading:', error);
        res.status(500).json({ error: 'Failed to save reading' });
    }
});

// Legacy get latest reading
app.get('/api/bulk-readings/:dmaId/:pointName/latest', async (req, res) => {
    try {
        const Reading = require('./models/Reading');
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
        res.status(500).json({ error: 'Failed to fetch reading' });
    }
});

// Legacy get history
app.get('/api/bulk-readings/:dmaId/:pointName/history', async (req, res) => {
    try {
        const Reading = require('./models/Reading');
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
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Get all bulk readings (in-memory, for debugging)
app.get('/api/bulk-readings', (req, res) => {
    console.log(`📤 GET /api/bulk-readings - Returning ${bulkReadings.length} readings`);
    res.json(bulkReadings);
});

// Get readings for specific DMA (in-memory)
app.get('/api/bulk-readings/:dmaId', (req, res) => {
    const { dmaId } = req.params;
    console.log(`📤 GET /api/bulk-readings/${dmaId}`);
    const readings = bulkReadings.filter(r => r.dmaId === dmaId);
    res.json(readings);
});

// ============= OTHER LEGACY ENDPOINTS =============

// NRW Calculator
app.post('/api/nrw/calculate', (req, res) => {
    const systemInput = parseFloat(req.body.systemInput) || 950000;
    const billedConsumption = parseFloat(req.body.billedConsumption) || 775000;
    const nrwVolume = systemInput - billedConsumption;
    const nrwPercentage = (nrwVolume / systemInput * 100).toFixed(2);
    
    res.json({
        nrwPercentage: nrwPercentage,
        nrwVolume: nrwVolume,
        components: {
            leaks: nrwVolume * 0.4,
            meterInaccuracies: nrwVolume * 0.3,
            unauthorizedConsumption: nrwVolume * 0.2,
            bursts: nrwVolume * 0.1
        },
        financial: {
            costPerUnit: 0.85,
            totalLossValue: (nrwVolume * 0.85).toFixed(2),
            potentialSavings: (nrwVolume * 0.85 * 0.4).toFixed(2)
        },
        recommendations: [
            "Implement pressure management in high-loss zones",
            "Schedule meter accuracy testing",
            "Conduct leak detection survey",
            "Review unauthorized consumption cases"
        ]
    });
});

// Customer History
app.get('/api/customers/history/:id', (req, res) => {
    const customerId = req.params.id;
    res.json({
        customerInfo: {
            id: customerId,
            name: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+1-555-0123',
            address: '123 Main St, Cityville',
            meterNumber: 'MTR-001',
            zone: 'North Zone',
            accountStatus: 'Active',
            connectionDate: '2018-05-15',
            creditScore: 750
        },
        billingSummary: {
            totalBilled: 1250.50,
            totalPaid: 1000.00,
            outstanding: 250.50,
            averageConsumption: 35.8,
            lastPaymentDate: '2024-11-01'
        },
        consumptionHistory: [
            { month: '2024-01', consumption: 32, billAmount: 45.60, status: 'Paid' },
            { month: '2024-02', consumption: 32, billAmount: 45.60, status: 'Paid' },
            { month: '2024-03', consumption: 35, billAmount: 49.85, status: 'Paid' },
            { month: '2024-04', consumption: 33, billAmount: 47.05, status: 'Paid' },
            { month: '2024-05', consumption: 39, billAmount: 55.58, status: 'Paid' },
            { month: '2024-06', consumption: 44, billAmount: 62.70, status: 'Paid' },
            { month: '2024-07', consumption: 48, billAmount: 68.40, status: 'Paid' },
            { month: '2024-08', consumption: 46, billAmount: 65.55, status: 'Paid' },
            { month: '2024-09', consumption: 43, billAmount: 61.28, status: 'Paid' },
            { month: '2024-10', consumption: 40, billAmount: 57.00, status: 'Paid' },
            { month: '2024-11', consumption: 37, billAmount: 52.73, status: 'Pending' },
            { month: '2024-12', consumption: 44, billAmount: 62.70, status: 'Unpaid' }
        ],
        serviceHistory: [
            { date: '2023-12-10', type: 'Maintenance', description: 'Meter replacement', status: 'Completed' },
            { date: '2024-02-15', type: 'Inspection', description: 'Routine check', status: 'Completed' },
            { date: '2024-04-20', type: 'Complaint', description: 'Low pressure', status: 'Resolved' }
        ]
    });
});

// Bill Extraction
app.post('/api/bill/extract', async (req, res) => {
    try {
        const response = await axios.post('http://197.156.64.238:5001/extract', req.body, { 
            timeout: 3000,
            validateStatus: false
        }).catch(() => null);
        
        if (response && response.data) {
            res.json(response.data);
        } else {
            res.json({
                billNumber: req.body.billNumber || 'BILL-2024-001',
                meterNumber: req.body.meterNumber || 'MTR-2024-001',
                customerId: req.body.customerId || 'CUST-001',
                billingPeriod: 'December 2024',
                issueDate: '2024-12-01',
                dueDate: '2025-01-05',
                previousReading: 642,
                currentReading: 686,
                consumption: 44,
                rate: 1.425,
                charges: {
                    waterCharge: 44.00,
                    sewerCharge: 13.20,
                    serviceCharge: 5.50,
                    total: 62.70
                },
                paymentStatus: 'Pending',
                meterStatus: 'Normal'
            });
        }
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to extract bill data',
            details: error.message 
        });
    }
});

// Analytics Overview
app.get('/api/analytics/overview', (req, res) => {
    res.json({
        totalCustomers: 6780,
        activeMeters: 6485,
        monthlyConsumption: 723400,
        nrwAverage: 18.5,
        revenueYTD: 892450,
        collectionRate: 94.2,
        customerSatisfaction: 4.2,
        trends: {
            customers: '+5.2%',
            consumption: '+3.1%',
            revenue: '+7.4%',
            nrw: '-2.1%'
        }
    });
});

// Shapefile endpoint
app.get('/api/shapefile/:dmaId', (req, res) => {
    const { dmaId } = req.params;
    res.json({
        message: `Shapefile for ${dmaId} would be served here`,
        dmaId
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend test endpoint is working',
        time: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n✅ Water Utility Backend running on port ' + PORT);
    console.log('📊 API available at http://localhost:' + PORT + '/api');
    console.log('🗄️  Database: MongoDB');
    console.log('\n📌 Available endpoints:');
    console.log('   🔐 AUTHENTICATION:');
    console.log('   - POST /api/auth/register - Register new user');
    console.log('   - POST /api/auth/login - Login user');
    console.log('   - GET  /api/auth/me - Get current user');
    console.log('\n   📊 READINGS (MongoDB):');
    console.log('   - POST /api/readings - Save reading');
    console.log('   - GET  /api/readings - Get all readings');
    console.log('   - GET  /api/readings/:dmaId - Get DMA readings');
    console.log('   - GET  /api/readings/:dmaId/:pointName/latest - Get latest reading');
    console.log('   - GET  /api/readings/:dmaId/:pointName/history - Get history');
    console.log('\n   📱 LEGACY ENDPOINTS (Backward Compatible):');
    console.log('   - GET  /api/health - Health check');
    console.log('   - GET  /api/test - Test endpoint');
    console.log('   - GET  /api/dma/history - DMA dashboard data');
    console.log('   - POST /api/bulk-readings - Save reading (legacy)');
    console.log('   - GET  /api/bulk-readings - Get all readings');
    console.log('   - GET  /api/bulk-readings/:dmaId - Get DMA readings');
    console.log('   - GET  /api/bulk-readings/:dmaId/:pointName/latest - Get latest');
    console.log('   - GET  /api/bulk-readings/:dmaId/:pointName/history - Get history');
    console.log('\n   🔧 UTILITIES:');
    console.log('   - POST /api/nrw/calculate - NRW calculator');
    console.log('   - GET  /api/customers/history/:id - Customer history');
    console.log('   - POST /api/bill/extract - Bill extraction');
    console.log('   - GET  /api/analytics/overview - Analytics');
    console.log('   - GET  /api/shapefile/:dmaId - Shapefile data\n');
});