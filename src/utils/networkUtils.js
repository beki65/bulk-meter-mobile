// src/utils/networkUtils.js

// Function to get local IP address
export const getLocalIP = async () => {
  // Method 1: Use WebRTC to get local IP (works in browsers)
  return new Promise((resolve, reject) => {
    try {
      // Create a RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pc.createDataChannel('');
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(err => reject(err));
      
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) return;
        
        const candidate = event.candidate.candidate;
        const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
        const ipMatch = candidate.match(ipRegex);
        
        if (ipMatch) {
          const ip = ipMatch[0];
          // Filter out localhost and private IP ranges
          if (ip !== '0.0.0.0' && !ip.startsWith('127.') && !ip.startsWith('169.254')) {
            pc.close();
            resolve(ip);
          }
        }
      };
      
      setTimeout(() => {
        pc.close();
        reject(new Error('Timeout getting IP'));
      }, 3000);
    } catch (error) {
      reject(error);
    }
  });
};

// Function to test connection to backend
export const testBackendConnection = async (url, timeout = 5000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to scan local network for backend
export const scanLocalNetwork = async (baseIp, startPort = 8000, endPort = 8000) => {
  const results = [];
  const base = baseIp.substring(0, baseIp.lastIndexOf('.') + 1);
  
  for (let i = 1; i <= 254; i++) {
    const ip = `${base}${i}`;
    const url = `http://${ip}:${startPort}/api`;
    
    try {
      const result = await testBackendConnection(url, 1000);
      if (result.success) {
        results.push({ ip, url, port: startPort });
        console.log(`✅ Found backend at: ${url}`);
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  return results;
};

// Get all possible local IPs (for different network interfaces)
export const getAllLocalIPs = async () => {
  const ips = [];
  
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => {});
    
    pc.onicecandidate = (event) => {
      if (!event || !event.candidate) return;
      
      const candidate = event.candidate.candidate;
      const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
      const ipMatch = candidate.match(ipRegex);
      
      if (ipMatch) {
        const ip = ipMatch[0];
        if (!ips.includes(ip) && !ip.startsWith('127.') && !ip.startsWith('169.254')) {
          ips.push(ip);
        }
      }
    };
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    pc.close();
  } catch (error) {
    console.log('Error detecting IPs:', error);
  }
  
  return ips;
};