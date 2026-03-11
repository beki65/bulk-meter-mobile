const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createUserDirect() {
  try {
    console.log('📡 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/water-utility');
    console.log('✅ Connected to MongoDB');
    
    // Define a simple schema
    const userSchema = new mongoose.Schema({
      username: String,
      password: String,
      name: String,
      role: String,
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date
    });
    
    // Create model (temporary, not using your existing model)
    const User = mongoose.model('User', userSchema);
    
    console.log('🔑 Hashing password...');
    
    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    console.log('✅ Hashed password created');
    
    // Delete existing admin users
    await User.deleteMany({ username: 'admin' });
    console.log('✅ Removed existing admin users');
    
    // Create new admin
    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('\n✅ SUCCESS! Admin user created!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('User ID:', admin._id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Verify the password works
    console.log('🔍 Testing password verification...');
    const isValid = await bcrypt.compare('admin123', hashedPassword);
    console.log('Password verification:', isValid ? '✅ PASSED' : '❌ FAILED');
    
    // Count total users
    const totalUsers = await User.countDocuments();
    console.log('📊 Total users in database:', totalUsers);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed');
  }
}

createUserDirect();