class CustomerDataService {
  constructor() {
    this.useCSV = true; // Use geospatial CSV service
    this.service = null;
  }

  async init() {
    if (this.useCSV) {
      const { default: geoService } = await import('./geoCustomerService');
      this.service = geoService;
      console.log('🗺️ Using Geospatial CSV data source');
    } else {
      const { default: apiService } = await import('./apiDataService');
      this.service = new apiService('http://your-api-url.com/api');
      console.log('🌐 Using API data source');
    }
    return this.service;
  }

  async getService() {
    if (!this.service) {
      await this.init();
    }
    return this.service;
  }

  isUsingCSV() {
    return this.useCSV;
  }

  setDataSource(useCSV) {
    this.useCSV = useCSV;
    this.service = null;
  }
}

export default new CustomerDataService();