import Papa from 'papaparse';

class CSVDataService {
  constructor() {
    this.customers = []; // Will store unique customers with aggregated history
    this.rawRecords = []; // Store all raw records
    this.loaded = false;
    this.availableMonths = [];
  }

  // Load CSV file with error handling
  async loadCSVData() {
    if (this.loaded) return this.customers;

    return new Promise((resolve) => {
      // Path to your CSV file in the public folder
      Papa.parse('/data/bill-data.csv', {
        header: true,
        download: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            console.log(`✅ Loaded ${results.data.length} bill records from CSV`);
            this.rawRecords = results.data;
            this.processData();
          } else {
            console.warn('⚠️ CSV file is empty, using sample data');
            this.rawRecords = this.getSampleRawData();
            this.processData();
          }
          this.loaded = true;
          resolve(this.customers);
        },
        error: (error) => {
          console.error('❌ Failed to load CSV:', error);
          console.warn('⚠️ Using sample data instead');
          this.rawRecords = this.getSampleRawData();
          this.processData();
          this.loaded = true;
          resolve(this.customers);
        }
      });
    });
  }

  // Process raw records into customer history
  processData() {
    // Group records by customer ID
    const customerMap = new Map();
    const monthSet = new Set();

    this.rawRecords.forEach((record, index) => {
      const custKey = record['CUST_KEY'] || `CUST-${index}`;
      
      if (!customerMap.has(custKey)) {
        customerMap.set(custKey, {
          records: [],
          customerInfo: this.extractCustomerInfo(record)
        });
      }
      
      customerMap.get(custKey).records.push(record);
      
      // Track unique months for sorting
      if (record['PERIOD'] || record['BILL_DATE']) {
        monthSet.add(record['PERIOD'] || record['BILL_DATE']);
      }
    });

    // Sort available months (you may need better date parsing)
    this.availableMonths = Array.from(monthSet).sort();

    // Process each customer's records into monthly history
    this.customers = Array.from(customerMap.entries()).map(([custKey, data]) => {
      return this.buildCustomerHistory(custKey, data.customerInfo, data.records);
    });

    console.log(`✅ Processed ${this.customers.length} unique customers with history`);
  }

  // Extract basic customer info (same across all records)
  extractCustomerInfo(record) {
    const branch = record['BRANCH'] || '';
    const routeKey = record['ROUTE_KEY'] || '';
    
    let dmaId = 'DMA-UNKNOWN';
    if (branch === 'MG' || routeKey.includes('MG')) dmaId = 'DMA-YKA';
    else if (branch === 'JFR' || routeKey.includes('JFR')) dmaId = 'DMA-JFR';
    else if (branch === '2019' || routeKey.includes('2019')) dmaId = 'DMA-2019';
    
    // Extract customer name from first column (it has no header)
    const firstKey = Object.keys(record)[0];
    const customerName = record[firstKey] || 'Unknown Customer';

    return {
      id: record['CUST_KEY'] || '',
      name: customerName,
      dmaId: dmaId,
      dmaName: dmaId,
      meterNumber: record['METER_KEY'] || '',
      meterKey: record['METER_KEY'] || '',
      address: record['ADDRESS'] || '',
      contractNumber: record['CONTRACT_N'] || '',
      routeKey: routeKey,
      branch: branch,
      latitude: parseFloat(record['latit']) || null,
      longitude: parseFloat(record['long']) || null,
      category: record['CATEGORY_T'] || '',
      meterDiameter: record['METER_DIAM'] || '',
      // We'll determine meter key changed by comparing meter keys across months
    };
  }

  // Build 12-month consumption history for a customer
  buildCustomerHistory(custKey, customerInfo, records) {
    // Sort records by date (you may need better date parsing)
    const sortedRecords = records.sort((a, b) => {
      const dateA = this.parseDate(a['BILL_DATE'] || a['PERIOD']);
      const dateB = this.parseDate(b['BILL_DATE'] || b['PERIOD']);
      return dateA - dateB;
    });

    // Take last 12 months (most recent)
    const last12Months = sortedRecords.slice(-12);
    
    // Initialize monthly consumption arrays
    const consumption = {
      month1: 0, month2: 0, month3: 0, month4: 0, month5: 0, month6: 0,
      month7: 0, month8: 0, month9: 0, month10: 0, month11: 0, month12: 0
    };
    
    const bills = {
      month1: 0, month2: 0, month3: 0, month4: 0, month5: 0, month6: 0,
      month7: 0, month8: 0, month9: 0, month10: 0, month11: 0, month12: 0
    };

    const history = [];

    // Fill in the months we have data for (starting from most recent)
    last12Months.forEach((record, index) => {
      const monthIndex = 12 - last12Months.length + index;
      const consumption_value = parseFloat(record['CURR_CONS']) || 0;
      const bill_value = parseFloat(record['BILL_AMOUN']) || 0;
      
      if (monthIndex >= 0 && monthIndex < 12) {
        consumption[`month${monthIndex + 1}`] = consumption_value;
        bills[`month${monthIndex + 1}`] = bill_value;
      }
      
      history.push({
        month: record['PERIOD'] || `Month ${index + 1}`,
        consumption: consumption_value,
        billAmount: bill_value,
        totalAmount: parseFloat(record['TOT_AMNT']) || 0,
        waterConsumption: parseFloat(record['WATER_CONS']) || 0,
        currentReading: parseFloat(record['CURR_RDG']) || 0,
        previousReading: parseFloat(record['PREV_RDG']) || 0,
        dueDate: record['DUE_DATE'] || '',
        billDate: record['BILL_DATE'] || ''
      });
    });

    // Check if meter key changed by comparing first and last record's meter key
    const firstMeterKey = sortedRecords[0]?.['METER_KEY'];
    const lastMeterKey = sortedRecords[sortedRecords.length - 1]?.['METER_KEY'];
    const meterKeyChanged = firstMeterKey !== lastMeterKey && firstMeterKey && lastMeterKey;

    // Get most recent record for current info
    const latestRecord = sortedRecords[sortedRecords.length - 1] || {};

    return {
      ...customerInfo,
      meterKeyChanged: meterKeyChanged,
      lastReading: parseFloat(latestRecord['CURR_RDG']) || 0,
      lastReadingDate: latestRecord['BILL_DATE'] || '',
      status: 'active', // You might determine from recency of bills
      
      // Monthly data arrays
      consumption: consumption,
      bills: bills,
      history: history,
      
      // Summary stats for this customer
      totalConsumption: Object.values(consumption).reduce((a, b) => a + b, 0),
      averageConsumption: this.calculateAverageFromArray(Object.values(consumption)),
      peakConsumption: Math.max(...Object.values(consumption)),
      zeroMonths: Object.values(consumption).filter(v => v === 0).length,
      
      // Latest bill info
      currentBill: {
        amount: parseFloat(latestRecord['BILL_AMOUN']) || 0,
        totalAmount: parseFloat(latestRecord['TOT_AMNT']) || 0,
        period: latestRecord['PERIOD'] || '',
        dueDate: latestRecord['DUE_DATE'] || ''
      }
    };
  }

  // Parse date from various formats
  parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    
    // Handle formats like "25-Jul" or "7/1/2025 0:00"
    if (dateStr.includes('/')) {
      return new Date(dateStr);
    } else if (dateStr.includes('-')) {
      // Convert "25-Jul" to a date (assume current year or parse appropriately)
      const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const parts = dateStr.split('-');
      if (parts.length === 2) {
        const day = parseInt(parts[0]);
        const month = months[parts[1]] || 0;
        return new Date(2024, month, day); // Use appropriate year
      }
    }
    return new Date(0);
  }

  // Calculate average from array
  calculateAverageFromArray(values) {
    const validValues = values.filter(v => v > 0);
    if (validValues.length === 0) return 0;
    return validValues.reduce((a, b) => a + b, 0) / validValues.length;
  }

  // Sample data generator
  getSampleRawData() {
    const sampleData = [];
    const customers = [
      { id: 'C-000000175964', name: 'YEKA K/K N/A', dma: 'MG', meter: 'A&M-0904026664' },
      { id: 'C-000000175965', name: 'JAFAR M/J', dma: 'JFR', meter: 'A&M-0904026665' },
      { id: 'C-000000175966', name: '2019 RESIDENTIAL', dma: '2019', meter: 'A&M-0904026666' }
    ];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    customers.forEach(cust => {
      months.forEach((month, idx) => {
        // Generate some variation in consumption
        const consumption = 30 + Math.random() * 50;
        
        sampleData.push({
          'YEKA K/K N/A': cust.name,
          'CUST_KEY': cust.id,
          'METER_KEY': cust.meter,
          'BRANCH': cust.dma,
          'ROUTE_KEY': `108${cust.dma}`,
          'PERIOD': month,
          'CURR_CONS': consumption.toFixed(2),
          'WATER_CONS': (consumption * 0.8).toFixed(2),
          'BILL_AMOUN': (consumption * 1.5).toFixed(2),
          'TOT_AMNT': (consumption * 1.8).toFixed(2),
          'METER_RENT': '16',
          'SEWERAGE': '2.92',
          'SANITATION': '0',
          'MAINTAINAN': '0.42',
          'PREV_RDG': (1000 + idx * 50).toString(),
          'CURR_RDG': (1000 + idx * 50 + consumption).toString(),
          'BILL_DATE': `2025-${idx + 1}-15`,
          'DUE_DATE': `2025-${idx + 2}-1`,
          'ADDRESS': `${cust.name} AREA`,
          'latit': '9.02444653',
          'long': '38.79489599'
        });
      });
    });
    
    return sampleData;
  }

  // ============= METHODS USED BY YOUR COMPONENT =============

  async getCustomersByDMA(dmaId, filters = {}) {
    await this.loadCSVData();
    
    let filtered = this.customers.filter(c => c.dmaId === dmaId);
    
    // Apply filters
    if (filters.minConsumption) {
      const min = parseFloat(filters.minConsumption);
      filtered = filtered.filter(c => (c.averageConsumption || 0) >= min);
    }
    
    if (filters.zeroConsumption === true) {
      filtered = filtered.filter(c => c.zeroMonths > 0);
    }
    
    if (filters.meterKeyChanged !== null && filters.meterKeyChanged !== undefined) {
      const shouldBeChanged = filters.meterKeyChanged === true;
      filtered = filtered.filter(c => c.meterKeyChanged === shouldBeChanged);
    }
    
    return filtered;
  }

  async getDMAStatistics(dmaId) {
    await this.loadCSVData();
    
    const dmaCustomers = this.customers.filter(c => c.dmaId === dmaId);
    
    // Calculate statistics
    const totalCustomers = dmaCustomers.length;
    const zeroConsumption = dmaCustomers.filter(c => c.zeroMonths > 0).length;
    const highConsumption = dmaCustomers.filter(c => 
      (c.averageConsumption || 0) > 100
    ).length;
    const meterKeyChanged = dmaCustomers.filter(c => c.meterKeyChanged).length;
    
    // Calculate total consumption and billing
    const totalConsumption = dmaCustomers.reduce((sum, c) => 
      sum + (c.totalConsumption || 0), 0
    );
    
    const totalBilled = dmaCustomers.reduce((sum, c) => 
      sum + (c.currentBill?.totalAmount || 0), 0
    );
    
    return {
      dmaId,
      totalCustomers,
      activeCustomers: dmaCustomers.length, // Assume all active for now
      zeroConsumption,
      highConsumption,
      meterKeyChanged,
      meterKeyNotChanged: totalCustomers - meterKeyChanged,
      averageConsumption: totalCustomers > 0 ? totalConsumption / totalCustomers : 0,
      totalBilled,
      totalConsumption,
      availableMonths: this.availableMonths
    };
  }

  async getCustomerConsumptionHistory(customerId, months = 12) {
    await this.loadCSVData();
    
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return null;
    
    // Return last 'months' of history
    const history = customer.history.slice(-months);
    
    return {
      customer: {
        id: customer.id,
        name: customer.name,
        meterNumber: customer.meterNumber,
        meterKey: customer.meterKey,
        meterKeyChanged: customer.meterKeyChanged,
        address: customer.address,
        status: customer.status,
        contractNumber: customer.contractNumber,
        routeKey: customer.routeKey,
        branch: customer.branch,
        latitude: customer.latitude,
        longitude: customer.longitude,
        category: customer.category,
        meterDiameter: customer.meterDiameter
      },
      history: history,
      averageConsumption: customer.averageConsumption || 0,
      zeroMonths: customer.zeroMonths || 0,
      peakConsumption: customer.peakConsumption || 0,
      trend: this.calculateTrend(history.map(h => h.consumption))
    };
  }

  async checkMeterStatus(customerId) {
    await this.loadCSVData();
    
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return null;
    
    return {
      customerId: customer.id,
      meterNumber: customer.meterNumber,
      meterKey: customer.meterKey,
      keyChanged: customer.meterKeyChanged,
      lastReading: customer.lastReading,
      lastReadingDate: customer.lastReadingDate,
      status: customer.status,
      history: customer.history.slice(-3).map(h => ({
        date: h.billDate || h.month,
        reading: h.currentReading,
        consumption: h.consumption
      }))
    };
  }

  // ============= HELPER METHODS =============

  calculateAverageConsumption(customer) {
    return customer.averageConsumption || 0;
  }

  hasZeroConsumption(customer) {
    return customer.zeroMonths > 0;
  }

  countZeroMonths(customer) {
    return customer.zeroMonths || 0;
  }

  calculateTrend(consumptionArray) {
    const values = consumptionArray.filter(v => v > 0);
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  calculateDMAAverage(customers) {
    if (customers.length === 0) return 0;
    const total = customers.reduce((sum, c) => 
      sum + (c.averageConsumption || 0), 0
    );
    return total / customers.length;
  }

  calculateTotalBilled(customers) {
    return customers.reduce((sum, c) => 
      sum + (c.currentBill?.totalAmount || 0), 0
    );
  }
}

export default new CSVDataService();