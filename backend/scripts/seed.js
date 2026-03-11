const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/database');

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Create admin user
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123', // Will be hashed automatically
        name: 'System Administrator',
        email: 'admin@waterutility.com',
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    // Create test field worker
    const workerExists = await User.findOne({ username: 'worker' });
    
    if (!workerExists) {
      await User.create({
        username: 'worker',
        password: 'worker123',
        name: 'Field Worker',
        email: 'worker@waterutility.com',
        role: 'field_worker',
        assignedDMA: ['DMA-JFR', 'DMA-YKA'],
        isActive: true
      });
      console.log('✅ Field worker created');
    }
    
    console.log('✅ Database seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();