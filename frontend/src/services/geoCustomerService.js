import Papa from 'papaparse';
import * as turf from '@turf/turf';

class GeoCustomerService {
  constructor() {
    this.customers = [];
    this.rawRecords = [];
    this.loaded = false;
    this.dmaBoundaries = null;
  }

  initializeDMABoundaries() {
    console.log('🗺️ Initializing DMA boundaries from QGIS data...');
    
    // Yeka DMA boundary (correct order)
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
      [9.029017912043312, 38.78849768813164] // Back to start
    ];

    // Jafar DMA boundary - CORRECTLY ORDERED from QGIS
    const jafarPoints = [
      [8.979636347139426, 38.77195634015269],  // vertex 0
      [8.979636158497764, 38.77195652879431],  // vertex 1
      [8.979431105032548, 38.77203934247541],  // vertex 2
      [8.97906891307927, 38.77217818272439],   // vertex 3
      [8.978507515551664, 38.772419644026904], // vertex 4
      [8.978175506261138, 38.772550938610145], // vertex 5
      [8.977591471736453, 38.772796927312086], // vertex 6
      [8.977280590309874, 38.77292822189533],  // vertex 7
      [8.976851996498473, 38.77311686353791],  // vertex 8
      [8.976542624205022, 38.77325872205312],  // vertex 9
      [8.976240797577292, 38.77335983397361],  // vertex 10
      [8.97602348240533, 38.773447363695766],  // vertex 11
      [8.975780511969985, 38.77354847561619],  // vertex 12
      [8.975347390759184, 38.77371900766112],  // vertex 13
      [8.974651680382223, 38.77401177949043],  // vertex 14
      [8.974102355919731, 38.774248713393526], // vertex 15
      [8.973860894617529, 38.77436642577845],  // vertex 16
      [8.97350926659619, 38.7745460126222],    // vertex 17
      [8.973240640897478, 38.774681834604834], // vertex 18
      [8.97256153098498, 38.77510741015034],   // vertex 19
      [8.97209068144603, 38.77467277980661],   // vertex 20
      [8.971849220144168, 38.77414156494185],  // vertex 21
      [8.971897512405532, 38.77236682437054],  // vertex 22
      [8.972911649874831, 38.77181146337491],  // vertex 23
      [8.97349115700005, 38.771642440463054],  // vertex 24
      [8.974046517995447, 38.77076110670966],  // vertex 25
      [8.973805056693964, 38.76951758100337],  // vertex 26
      [8.973901641215102, 38.76898636613844],  // vertex 27
      [8.974275906233755, 38.76833442062227],  // vertex 28
      [8.974951997880217, 38.76747723299903],  // vertex 29
      [8.974843340294916, 38.76620956116246],  // vertex 30
      [8.975302116769164, 38.765871515339114], // vertex 31
      [8.975736747112819, 38.766257853422424], // vertex 32
      [8.977113076534504, 38.76725991782588],  // vertex 33
      [8.978175506263053, 38.768938073875745], // vertex 34
      [8.978839524843256, 38.770248001439924], // vertex 35
      [8.979636347139426, 38.77195634015269]   // back to start
    ];

    console.log(`📍 Jafar points: ${jafarPoints.length}, Yeka points: ${yekaPoints.length}`);

    // Calculate Jafar bounds for verification
    const jafarLats = jafarPoints.map(p => p[0]);
    const jafarLngs = jafarPoints.map(p => p[1]);
    console.log('📍 Jafar DMA range:');
    console.log(`  Latitude: ${Math.min(...jafarLats).toFixed(4)} to ${Math.max(...jafarLats).toFixed(4)}`);
    console.log(`  Longitude: ${Math.min(...jafarLngs).toFixed(4)} to ${Math.max(...jafarLngs).toFixed(4)}`);

    // Create polygons - Turf expects [longitude, latitude]
    this.dmaBoundaries = {
      'DMA-JFR': turf.polygon([jafarPoints.map(p => [p[1], p[0]])]),
      'DMA-YKA': turf.polygon([yekaPoints.map(p => [p[1], p[0]])])
    };
    
    // Verify polygons are valid
    try {
      turf.cleanCoords(this.dmaBoundaries['DMA-JFR']);
      turf.cleanCoords(this.dmaBoundaries['DMA-YKA']);
      console.log('✅ Polygons are valid');
    } catch (e) {
      console.error('❌ Polygon validation failed:', e);
    }
    
    console.log('✅ DMA boundaries initialized');
  }

  async loadCSVData() {
    if (this.loaded) return this.customers;

    console.log('🔍 Loading CSV data...');
    this.initializeDMABoundaries();

    return new Promise((resolve) => {
      Papa.parse('/data/bill-data.csv', {
        header: true,
        download: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('✅ CSV loaded:', results.data.length, 'total rows');
          
          if (results.data && results.data.length > 0) {
            this.rawRecords = results.data.map(row => ({
              NAME: row['NAME'] || 'Unknown',
              CUST_KEY: row['CUST_KEY'] || '',
              PERIOD: row['PERIOD'] || '',
              ADDRESS: row['ADDRESS'] || '',
              METER_KEY: row['METER_KEY'] || '',
              x: parseFloat(row['x']), // Latitude
              y: parseFloat(row['y']), // Longitude
              TOT_CONS: parseFloat(row['TOT_CONS']) || 0,
              TOT_AMNT: parseFloat(row['TOT_AMNT']) || 0
            })).filter(row => row.CUST_KEY && !isNaN(row.x) && !isNaN(row.y));
            
            console.log(`📊 Records with coordinates: ${this.rawRecords.length}`);
            this.processData();
          } else {
            this.rawRecords = this.getSampleData();
            this.processData();
          }
          
          this.loaded = true;
          resolve(this.customers);
        },
        error: (error) => {
          console.error('❌ CSV error:', error);
          this.rawRecords = this.getSampleData();
          this.processData();
          this.loaded = true;
          resolve(this.customers);
        }
      });
    });
  }

  processData() {
    console.log('📊 Assigning customers to DMA polygons...');
    
    const customerMap = new Map();
    let jfrCount = 0, ykaCount = 0, unknownCount = 0;
    
    // First, let's see where Jafar customers should be
    const jafarBounds = turf.bbox(this.dmaBoundaries['DMA-JFR']);
    console.log('📍 Jafar polygon bounds:', {
      minLng: jafarBounds[0],
      minLat: jafarBounds[1],
      maxLng: jafarBounds[2],
      maxLat: jafarBounds[3]
    });
    
    this.rawRecords.forEach(record => {
      const custKey = record.CUST_KEY;
      if (!custKey) return;
      
      if (!customerMap.has(custKey)) {
        // Create point - Turf expects [longitude, latitude]
        const point = turf.point([record.y, record.x]);
        
        // Check Jafar first
        if (turf.booleanPointInPolygon(point, this.dmaBoundaries['DMA-JFR'])) {
          customerMap.set(custKey, {
            id: custKey,
            name: record.NAME,
            dmaId: 'DMA-JFR',
            meterNumber: record.METER_KEY,
            address: record.ADDRESS,
            latitude: record.x,
            longitude: record.y,
            records: []
          });
          jfrCount++;
        }
        // Check Yeka
        else if (turf.booleanPointInPolygon(point, this.dmaBoundaries['DMA-YKA'])) {
          customerMap.set(custKey, {
            id: custKey,
            name: record.NAME,
            dmaId: 'DMA-YKA',
            meterNumber: record.METER_KEY,
            address: record.ADDRESS,
            latitude: record.x,
            longitude: record.y,
            records: []
          });
          ykaCount++;
        }
        // Not in any DMA
        else {
          customerMap.set(custKey, {
            id: custKey,
            name: record.NAME,
            dmaId: 'DMA-UNKNOWN',
            meterNumber: record.METER_KEY,
            address: record.ADDRESS,
            latitude: record.x,
            longitude: record.y,
            records: []
          });
          unknownCount++;
        }
      }
      
      // Add record to customer's history
      const customer = customerMap.get(custKey);
      if (customer && customer.records) {
        customer.records.push({
          period: record.PERIOD,
          consumption: record.TOT_CONS,
          billAmount: record.TOT_AMNT
        });
      }
    });

    console.log('📊 FINAL DMA ASSIGNMENT RESULTS:');
    console.log('================================');
    console.log(`  DMA-JFR: ${jfrCount} customers (${((jfrCount/customerMap.size)*100).toFixed(1)}%)`);
    console.log(`  DMA-YKA: ${ykaCount} customers (${((ykaCount/customerMap.size)*100).toFixed(1)}%)`);
    console.log(`  DMA-UNKNOWN: ${unknownCount} customers (${((unknownCount/customerMap.size)*100).toFixed(1)}%)`);
    console.log(`  TOTAL: ${customerMap.size} customers`);
    console.log('================================');

    // Build final customers array
    this.customers = Array.from(customerMap.values()).map(data => {
      const records = data.records || [];
      const sortedRecords = [...records].sort((a, b) => 
        (a.period || '').localeCompare(b.period || '')
      );

      // Build monthly consumption
      const consumption = { 
        month1: 0, month2: 0, month3: 0, month4: 0, month5: 0, month6: 0,
        month7: 0, month8: 0, month9: 0, month10: 0, month11: 0, month12: 0 
      };
      const bills = { ...consumption };
      const history = [];

      sortedRecords.slice(-12).forEach((record, idx) => {
        const monthIdx = 12 - sortedRecords.slice(-12).length + idx;
        if (monthIdx >= 0 && monthIdx < 12) {
          consumption[`month${monthIdx + 1}`] = record.consumption;
          bills[`month${monthIdx + 1}`] = record.billAmount;
        }
        history.push({
          month: record.period || `Month ${idx + 1}`,
          consumption: record.consumption,
          billAmount: record.billAmount
        });
      });

      const latest = sortedRecords[sortedRecords.length - 1] || {};

      return {
        id: data.id,
        name: data.name,
        dmaId: data.dmaId,
        meterNumber: data.meterNumber,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        meterKeyChanged: false,
        status: 'active',
        consumption,
        bills,
        history,
        totalConsumption: Object.values(consumption).reduce((a, b) => a + b, 0),
        averageConsumption: this.calcAvg(Object.values(consumption)),
        peakConsumption: Math.max(...Object.values(consumption)),
        zeroMonths: Object.values(consumption).filter(v => v === 0).length,
        lastReading: latest.consumption || 0,
        lastReadingDate: latest.period || '',
        currentBill: {
          amount: latest.billAmount || 0,
          period: latest.period || ''
        }
      };
    });
  }

  calcAvg(values) {
    const valid = values.filter(v => v > 0);
    return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  }

  getSampleData() {
    return [
      { NAME: 'YEKA SCHOOL', CUST_KEY: '7075171', x: 9.0244, y: 38.7949, PERIOD: '25-Apr', TOT_CONS: 158, TOT_AMNT: 17706.33, METER_KEY: 'APG-34163475', ADDRESS: 'Bole' },
      { NAME: 'JAFAR HOUSE', CUST_KEY: '7076000', x: 8.9750, y: 38.7720, PERIOD: '25-Apr', TOT_CONS: 124, TOT_AMNT: 10540.00, METER_KEY: 'JFR-12345', ADDRESS: 'Jafar' }
    ];
  }

  async debug() {
    await this.loadCSVData();
    
    const jfr = this.customers.filter(c => c.dmaId === 'DMA-JFR').length;
    const yka = this.customers.filter(c => c.dmaId === 'DMA-YKA').length;
    const unk = this.customers.filter(c => c.dmaId === 'DMA-UNKNOWN').length;
    const total = this.customers.length;
    
    console.log('\n🔍 DEBUG SUMMARY:');
    console.log('=================');
    console.log(`Total customers: ${total}`);
    console.log(`DMA-JFR: ${jfr} (${((jfr/total)*100).toFixed(1)}%) - Expected ~1,033`);
    console.log(`DMA-YKA: ${yka} (${((yka/total)*100).toFixed(1)}%) - Expected ~2,000`);
    console.log(`DMA-UNKNOWN: ${unk} (${((unk/total)*100).toFixed(1)}%)`);
    
    return { jfr, yka, unk, total };
  }

  async getCustomersByDMA(dmaId, filters = {}) {
    await this.loadCSVData();
    return this.customers.filter(c => c.dmaId === dmaId);
  }

  async getDMAStatistics(dmaId) {
    await this.loadCSVData();
    const customers = this.customers.filter(c => c.dmaId === dmaId);
    
    return {
      dmaId,
      totalCustomers: customers.length,
      activeCustomers: customers.length,
      zeroConsumption: customers.filter(c => c.zeroMonths > 0).length,
      highConsumption: customers.filter(c => (c.averageConsumption || 0) > 100).length,
      meterKeyChanged: 0,
      meterKeyNotChanged: customers.length,
      averageConsumption: customers.length ? 
        customers.reduce((sum, c) => sum + (c.averageConsumption || 0), 0) / customers.length : 0
    };
  }

  async getCustomerConsumptionHistory(customerId, months = 12) {
    await this.loadCSVData();
    return this.customers.find(c => c.id === customerId) || null;
  }

  calculateAverageConsumption(customer) {
    return customer?.averageConsumption || 0;
  }
}

const geoCustomerService = new GeoCustomerService();
export default geoCustomerService;