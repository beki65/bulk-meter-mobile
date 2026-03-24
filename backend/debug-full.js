const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/User');
require('dotenv').config();

async function debugEverything() {
  console.log('🔍 FULL SYSTEM DIAGNOSTIC');
  console.log('========================\n');
  
  // Step 1: Check environment
  console.log('1️⃣ Environment Check:');
  console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
  console.log('   PORT:', process.env.PORT || '8000 (default)');
  console.log('');
  
  // Step 2: Check MongoDB connection directly
  console.log('2️⃣ Testing MongoDB Direct Connection:');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-utility');
    console.log('   ✅ MongoDB connected successfully');
    
    // Check if users collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('   Collections:', collections.map(c => c.name).join(', ') || 'none');
    
    // Check for existing users
    const userCount = await User.countDocuments();
    console.log('   Existing users:', userCount);
    
    if (userCount > 0) {
      const users = await User.find().select('-password');
      console.log('   Usernames:', users.map(u => u.username).join(', '));
    }
    
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
  }
  console.log('');
  
  // Step 3: Try to create user via API
  console.log('3️⃣ Testing API Registration:');
  try {
    const testUser = {
      username: 'test-' + Date.now(),
      password: 'test123',
      name: 'Test User',
      role: 'field_worker'
    };
    
    console.log('   Sending:', testUser);
    
    const response = await axios.post('http://localhost:8000/api/auth/register', testUser, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('   ✅ API Response:', response.status, response.statusText);
    console.log('   User created:', response.data.username);
    
  } catch (error) {
    console.log('   ❌ API Error:');
    if (error.response) {
      console.log('      Status:', error.response.status);
      console.log('      Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('      Cannot connect to backend on port 8000');
      console.log('      Make sure server.js is running!');
    } else {
      console.log('      Error:', error.message);
    }
  }
  console.log('');
  
  // Step 4: Test login with a simple request
  console.log('4️⃣ Testing API Login:');
  try {
    const loginAttempt = {
      username: 'admin',
      password: 'admin123'
    };
    
    console.log('   Attempting login with admin/admin123');
    
    const response = await axios.post('http://localhost:8000/api/auth/login', loginAttempt, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('   ✅ Login successful!');
    console.log('   User:', response.data.username);
    console.log('   Token received:', response.data.token ? '✅ Yes' : '❌ No');
    
  } catch (error) {
    console.log('   ❌ Login failed:');
    if (error.response) {
      console.log('      Status:', error.response.status);
      console.log('      Message:', error.response.data.message || error.response.data);
    } else {
      console.log('      Error:', error.message);
    }
  }
  console.log('');
  
  console.log('========================');
  console.log('✅ Diagnostic complete');
  
  // Close mongoose connection
  await mongoose.connection.close();
}

debugEverything();