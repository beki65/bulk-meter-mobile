import axios from 'axios';
import db from './BillDatabase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class CustomerService {
  constructor() {
    this.useDatabase = false;
    this.initialized = false;
  }
  
  async init() {
    if (this.initialized) return;
    
    try {
      const response = await axios.get(`${API_URL}/health`);
      this.useDatabase = response.data.database === 'connected';
      console.log(`📡 Using ${this.useDatabase ? 'database' : 'CSV'} data source`);
    } catch {
      this.useDatabase = false;
      console.log('📁 Using CSV data source');
    }
    
    this.initialized = true;
  }
  
  // Get customers by DMA
  async getCustomersByDMA(dmaId, filters = {}) {
    await this.init();
    
    if (this.useDatabase) {
      const params = new URLSearchParams({ dmaId });
      const response = await axios.get(`${API_URL}/customers?${params}`);
      let customers = response.data.customers;
      
      // Apply filters
      if (filters.minConsumption) {
        const min = parseFloat(filters.minConsumption);
        customers = customers.filter(c => (c.stats?.averageConsumption || 0) >= min);
      }
      
      if (filters.zeroConsumption === 'true') {
        customers = customers.filter(c => (c.stats?.zeroMonths || 0) > 0);
      }
      
      return customers;
    } else {
      // Use IndexedDB
      const allCustomers = await db.getAllCustomers();
      return allCustomers.filter(c => c.dmaId === dmaId);
    }
  }
  
  // Get DMA statistics
  async getDMAStatistics(dmaId) {
    await this.init();
    
    if (this.useDatabase) {
      const response = await axios.get(`${API_URL}/dma-stats/${dmaId}`);
      return response.data;
    } else {
      const customers = await this.getCustomersByDMA(dmaId);
      
      return {
        dmaId,
        totalCustomers: customers.length,
        activeCustomers: customers.length,
        zeroConsumption: customers.filter(c => (c.stats?.zeroMonths || 0) > 0).length,
        highConsumption: customers.filter(c => (c.stats?.averageConsumption || 0) > 100).length,
        meterKeyChanged: 0,
        meterKeyNotChanged: customers.length,
        averageConsumption: customers.length > 0 
          ? customers.reduce((sum, c) => sum + (c.stats?.averageConsumption || 0), 0) / customers.length 
          : 0
      };
    }
  }
  
  // Upload monthly CSV
  async uploadMonthlyCSV(file, month, year) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('month', month);
    formData.append('year', year);
    
    const response = await axios.post(
      `${API_URL}/upload-monthly-csv`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    
    return response.data;
  }
  
  // Get customer history
  async getCustomerConsumptionHistory(customerId) {
    await this.init();
    
    if (this.useDatabase) {
      const response = await axios.get(`${API_URL}/customers/${customerId}/history`);
      return response.data;
    } else {
      const customers = await db.getAllCustomers();
      return customers.find(c => c.id === customerId) || null;
    }
  }
  
  // Helper methods
  calculateAverageConsumption(customer) {
    return customer?.stats?.averageConsumption || 0;
  }
  
  hasZeroConsumption(customer) {
    return (customer?.stats?.zeroMonths || 0) > 0;
  }
  
  countZeroMonths(customer) {
    return customer?.stats?.zeroMonths || 0;
  }
}

const customerService = new CustomerService();
export default customerService;