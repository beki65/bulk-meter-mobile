const axios = require('axios');

async function createAdminUser() {
  try {
    console.log('📝 Creating admin user...');
    
    const response = await axios.post('http://localhost:8000/api/auth/register', {
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      role: 'admin',
      email: 'admin@waterutility.com'
    });
    
    console.log('✅ SUCCESS! Admin user created:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Username: admin`);
    console.log(`Password: admin123`);
    console.log(`Name: ${response.data.name}`);
    console.log(`Role: ${response.data.role}`);
    console.log(`Token: ${response.data.token.substring(0, 20)}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('You can now login to the mobile app with these credentials!');
    
  } catch (error) {
    console.error('❌ Error creating user:');
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Server response:', error.response.data);
      
      // If user already exists, try logging in instead
      if (error.response.data.message === 'User already exists') {
        console.log('\n⚠️  Admin user already exists!');
        console.log('Try logging in with:');
        console.log('  Username: admin');
        console.log('  Password: admin123');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response from server. Is your backend running?');
      console.error('Make sure to run: node server.js first!');
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
    }
  }
}

// Also create a field worker for testing
async function createWorkerUser() {
  try {
    console.log('\n📝 Creating field worker user...');
    
    const response = await axios.post('http://localhost:8000/api/auth/register', {
      username: 'worker',
      password: 'worker123',
      name: 'Field Worker',
      role: 'field_worker',
      email: 'worker@waterutility.com',
      assignedDMA: ['DMA-JFR', 'DMA-YKA']
    });
    
    console.log('✅ SUCCESS! Field worker created:');
    console.log(`Username: worker`);
    console.log(`Password: worker123`);
    
  } catch (error) {
    if (error.response?.data?.message === 'User already exists') {
      console.log('⚠️  Worker user already exists');
    } else {
      console.error('❌ Error creating worker:', error.response?.data || error.message);
    }
  }
}

// Run both
async function setup() {
  console.log('🚀 Starting user setup...');
  console.log('Make sure your backend is running on http://localhost:8000\n');
  
  await createAdminUser();
  await createWorkerUser();
  
  console.log('\n✨ Setup complete! You can now login with:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:  admin / admin123');
  console.log('Worker: worker / worker123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

setup();