import axios from 'axios';

class APIDataService {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getCustomersByDMA(dmaId, filters = {}) {
    try {
      const response = await this.api.get(`/customers/dma/${dmaId}`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('Failed to fetch customers from database');
    }
  }

  async getDMAStatistics(dmaId) {
    try {
      const response = await this.api.get(`/dma/${dmaId}/statistics`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('Failed to fetch DMA statistics');
    }
  }

  async getCustomerConsumptionHistory(customerId, months = 12) {
    try {
      const response = await this.api.get(`/customers/${customerId}/consumption`, {
        params: { months }
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('Failed to fetch customer history');
    }
  }

  async checkMeterStatus(customerId) {
    try {
      const response = await this.api.get(`/customers/${customerId}/meter-status`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('Failed to check meter status');
    }
  }

  // Helper methods (API should return calculated values)
  calculateAverageConsumption(customer) {
    return customer.averageConsumption || 0;
  }

  hasZeroConsumption(customer) {
    return customer.hasZeroConsumption || false;
  }

  countZeroMonths(customer) {
    return customer.zeroMonths || 0;
  }

  calculateTrend(customer) {
    return customer.trend || 'stable';
  }
}

export default APIDataService;