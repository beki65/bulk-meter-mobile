const mongoose = require('mongoose');

const MonthlyBillSchema = new mongoose.Schema({
  period: String,
  consumption: Number,
  billAmount: Number,
  totalAmount: Number,
  meterDiameter: Number,
  month: Number,
  year: Number,
  importDate: { type: Date, default: Date.now }
});

const CustomerSchema = new mongoose.Schema({
  custKey: { type: String, required: true, unique: true },
  name: String,
  contractNumber: String,
  chargeGroup: String,
  address: String,
  meterKey: String,
  x: Number,
  y: Number,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number]
  },
  billingHistory: [MonthlyBillSchema],
  dmaId: String,
  importSource: String,
  lastImportDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CustomerSchema.index({ location: '2dsphere' });
CustomerSchema.index({ custKey: 1 });
CustomerSchema.index({ dmaId: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);