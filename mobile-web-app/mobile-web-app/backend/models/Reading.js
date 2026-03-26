const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  dmaId: {
    type: String,
    required: true,
    enum: ['DMA-JFR', 'DMA-YKA', 'DMA-2019']
  },
  pointName: {
    type: String,
    required: true
  },
  meterReading: {
    type: Number,
    required: true
  },
  pointType: {
    type: String,
    enum: ['inlet', 'outlet'],
    default: 'inlet'
  },
  size: String,
  notes: String,
  latitude: Number,
  longitude: Number,
  timestamp: {
    type: Date,
    default: Date.now
  },
  date: String,
  source: {
    type: String,
    default: 'mobile'
  },
  synced: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
readingSchema.index({ dmaId: 1, pointName: 1, timestamp: -1 });

module.exports = mongoose.model('Reading', readingSchema);