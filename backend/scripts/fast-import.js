const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = 'mongodb://localhost:27017/water-utility';

// Source folder with your CSV files
const SOURCE_FOLDER = 'D:\\Bill fer webb';

// ONLY the columns you need
const NEEDED_COLUMNS = [
  'CUST_KEY',
  'NAME', 
  'CONTRACT_NUMBER',
  'CHARGE_GROUP',
  'PERIOD',
  'ADDRESS',
  'METER_KEY',
  'x',
  'y',
  'TOT_CONS',
  'METER_DIAMETER',
  'BILL_AMOUNT',
  'TOT_AMNT'
];

// File mapping
const files = [
  { filename: '01-2026.csv', month: 1, year: 2026 },
  { filename: '04-2025.csv', month: 4, year: 2025 },
  { filename: '05-2025.csv', month: 5, year: 2025 },
  { filename: '06-2025.csv', month: 6, year: 2025 },
  { filename: '07-2025.csv', month: 7, year: 2025 },
  { filename: '08-2025.csv', month: 8, year: 2025 },
  { filename: '09-2025.csv', month: 9, year: 2025 },
  { filename: '10-2025.csv', month: 10, year: 2025 },
  { filename: '11-2025.csv', month: 11, year: 2025 },
  { filename: '12-2025.csv', month: 12, year: 2025 }
];

// Schema
const CustomerSchema = new mongoose.Schema({
  custKey: { type: String, required: true, unique: true, index: true },
  name: String,
  contractNumber: String,
  chargeGroup: String,
  address: String,
  meterKey: String,
  latitude: Number,
  longitude: Number,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number]
  },
  billingHistory: [{
    period: String,
    consumption: Number,
    billAmount: Number,
    totalAmount: Number,
    meterDiameter: Number,
    month: Number,
    year: Number,
    importDate: { type: Date, default: Date.now }
  }],
  dmaId: String,
  createdAt: { type: Date, default: Date.now }
});

CustomerSchema.index({ location: '2dsphere' });
CustomerSchema.index({ dmaId: 1 });

const Customer = mongoose.model('Customer', CustomerSchema);

// Parse CSV line
function parseCSVLine(line, headers) {
  const values = line.split(',');
  const row = {};
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (NEEDED_COLUMNS.includes(header)) {
      let val = values[i];
      if (val) {
        val = val.replace(/^["']|["']$/g, '').trim();
      }
      row[header] = val;
    }
  }
  return row;
}

// Check if coordinates are valid
function hasValidCoordinates(row) {
  const x = parseFloat(row['x']);
  const y = parseFloat(row['y']);
  return !isNaN(x) && !isNaN(y) && x !== null && y !== null && 
         x > -90 && x < 90 && y > -180 && y < 180;
}

// Process a single record
async function processRecord(row, month, year) {
  const custKey = row['CUST_KEY'];
  if (!custKey) return { status: 'no_key' };
  
  if (!hasValidCoordinates(row)) return { status: 'no_coords' };
  
  const x = parseFloat(row['x']);
  const y = parseFloat(row['y']);
  
  const monthlyBill = {
    period: row['PERIOD'] || '',
    consumption: parseFloat(row['TOT_CONS']) || 0,
    billAmount: parseFloat(row['BILL_AMOUNT']) || 0,
    totalAmount: parseFloat(row['TOT_AMNT']) || 0,
    meterDiameter: parseFloat(row['METER_DIAMETER']) || 0,
    month: month,
    year: year
  };
  
  // Use updateOne with upsert to handle duplicates elegantly
  const result = await Customer.updateOne(
    { custKey: custKey },
    {
      $setOnInsert: {
        custKey: custKey,
        name: row['NAME'] || 'Unknown',
        contractNumber: row['CONTRACT_NUMBER'],
        chargeGroup: row['CHARGE_GROUP'],
        address: row['ADDRESS'],
        meterKey: row['METER_KEY'],
        latitude: x,
        longitude: y,
        location: { type: 'Point', coordinates: [y, x] }
      },
      $addToSet: {
        billingHistory: monthlyBill
      }
    },
    { upsert: true }
  );
  
  if (result.upsertedCount === 1) {
    return { status: 'created' };
  } else if (result.modifiedCount === 1) {
    return { status: 'updated' };
  } else {
    return { status: 'already_exists' };
  }
}

// Process file line by line
async function processFile(filePath, month, year) {
  return new Promise((resolve, reject) => {
    let headers = null;
    let processed = 0;
    let created = 0;
    let updated = 0;
    let skippedNoCoords = 0;
    let skippedNoKey = 0;
    let alreadyExists = 0;
    
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });
    
    rl.on('line', async (line) => {
      if (!headers) {
        headers = line.split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
        const foundColumns = headers.filter(h => NEEDED_COLUMNS.includes(h)).length;
        console.log(`   Found ${foundColumns} of ${NEEDED_COLUMNS.length} needed columns`);
        return;
      }
      
      processed++;
      
      const row = parseCSVLine(line, headers);
      
      // Pause while we process
      rl.pause();
      
      const result = await processRecord(row, month, year);
      
      if (result.status === 'created') created++;
      else if (result.status === 'updated') updated++;
      else if (result.status === 'no_coords') skippedNoCoords++;
      else if (result.status === 'no_key') skippedNoKey++;
      else if (result.status === 'already_exists') alreadyExists++;
      
      // Resume
      rl.resume();
      
      // Progress every 1000 records
      if (processed % 1000 === 0) {
        console.log(`   Progress: ${processed.toLocaleString()} | Created: ${created} | Updated: ${updated} | Skipped: ${skippedNoCoords}`);
      }
    });
    
    rl.on('close', () => {
      resolve({ 
        processed, created, updated, skippedNoCoords, skippedNoKey, alreadyExists 
      });
    });
    
    rl.on('error', reject);
  });
}

async function importAllFiles() {
  console.log('🚀 FAST IMPORT - Individual record processing');
  console.log('==============================================');
  console.log('📋 Each customer will get a bill record for each month\n');
  
  // Connect to MongoDB
  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');
  
  // Drop existing collection to start fresh
  try {
    await Customer.collection.drop();
    console.log('🗑️  Fresh start - dropped existing collection\n');
  } catch (e) {
    console.log('⚠️  No existing collection to drop\n');
  }
  
  let totalProcessed = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkippedCoords = 0;
  let totalSkippedKey = 0;
  
  for (const file of files) {
    const filePath = path.join(SOURCE_FOLDER, file.filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${file.filename} not found, skipping...\n`);
      continue;
    }
    
    const stats = fs.statSync(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📄 ${file.filename} (${fileSizeMB} MB) - Month ${file.month}/${file.year}`);
    
    const start = Date.now();
    const result = await processFile(filePath, file.month, file.year);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    console.log(`   ✅ Done in ${duration}s`);
    console.log(`      Created: ${result.created.toLocaleString()} | Updated: ${result.updated.toLocaleString()}`);
    console.log(`      Skipped (no coordinates): ${result.skippedNoCoords.toLocaleString()}`);
    console.log(`      Already had this month: ${result.alreadyExists.toLocaleString()}\n`);
    
    totalProcessed += result.processed;
    totalCreated += result.created;
    totalUpdated += result.updated;
    totalSkippedCoords += result.skippedNoCoords;
    totalSkippedKey += result.skippedNoKey;
  }
  
  // Final summary
  const totalCustomers = await Customer.countDocuments();
  const customersWithHistory = await Customer.countDocuments({ billingHistory: { $exists: true, $ne: [] } });
  
  console.log('==============================================');
  console.log('🎉 IMPORT COMPLETE!');
  console.log('==============================================');
  console.log(`Total records processed: ${totalProcessed.toLocaleString()}`);
  console.log(`New customers created: ${totalCreated.toLocaleString()}`);
  console.log(`Bill records added: ${totalUpdated.toLocaleString()}`);
  console.log(`Total customers in database: ${totalCustomers.toLocaleString()}`);
  console.log(`Customers with bill history: ${customersWithHistory.toLocaleString()}`);
  console.log(`Skipped (no coordinates): ${totalSkippedCoords.toLocaleString()}`);
  console.log(`Skipped (no CUST_KEY): ${totalSkippedKey.toLocaleString()}`);
  
  // Show how many customers have multiple months
  const multiMonth = await Customer.aggregate([
    { $project: { monthCount: { $size: '$billingHistory' } } },
    { $group: { _id: '$monthCount', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);
  
  console.log('\n📊 Bill History Distribution:');
  multiMonth.forEach(m => {
    console.log(`   ${m._id} months: ${m.count.toLocaleString()} customers`);
  });
  
  // Show months available
  const months = await Customer.aggregate([
    { $unwind: '$billingHistory' },
    { $group: { _id: { month: '$billingHistory.month', year: '$billingHistory.year' }, count: { $sum: 1 } } },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]);
  
  console.log('\n📊 Months in database:');
  months.forEach(m => console.log(`   ${m._id.month}/${m._id.year}: ${m.count.toLocaleString()} records`));
  
  console.log('\n📍 Sample customers (first 5):');
  const samples = await Customer.find().limit(5);
  samples.forEach((c, i) => {
    console.log(`   ${i+1}. ${c.custKey}: ${c.name}`);
    console.log(`      Location: (${c.latitude}, ${c.longitude})`);
    console.log(`      Months: ${c.billingHistory.length}`);
  });
  
  console.log('==============================================');
  
  await mongoose.disconnect();
  console.log('✅ Done');
}

// Run
importAllFiles().catch(console.error);