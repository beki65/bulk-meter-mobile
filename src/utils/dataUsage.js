import localforage from 'localforage';

const DATA_USAGE_KEY = 'data_usage';

export const trackDataUsage = async (bytes) => {
  try {
    const usage = await localforage.getItem(DATA_USAGE_KEY) || {
      wifi: 0,
      mobile: 0,
      total: 0,
      lastReset: new Date().toISOString()
    };
    
    const networkType = navigator.connection?.type || 'unknown';
    
    if (networkType === 'wifi' || networkType === 'ethernet') {
      usage.wifi += bytes;
    } else if (networkType === 'cellular') {
      usage.mobile += bytes;
    }
    usage.total += bytes;
    
    await localforage.setItem(DATA_USAGE_KEY, usage);
    return usage;
  } catch (error) {
    console.error('Error tracking data usage:', error);
  }
};

export const getDataUsage = async () => {
  return await localforage.getItem(DATA_USAGE_KEY) || {
    wifi: 0,
    mobile: 0,
    total: 0,
    lastReset: new Date().toISOString()
  };
};

export const resetDataUsage = async () => {
  await localforage.setItem(DATA_USAGE_KEY, {
    wifi: 0,
    mobile: 0,
    total: 0,
    lastReset: new Date().toISOString()
  });
};