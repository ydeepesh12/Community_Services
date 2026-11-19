const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide the medicine name'],
      trim: true,
      maxlength: [120, 'Medicine name cannot exceed 120 characters']
    },
    genericName: {
      type: String,
      trim: true,
      default: ''
    },
    dosage: {
      type: String,
      required: [true, 'Please provide the dosage (e.g., 1, 500, 10)'],
      trim: true
    },
    dosageUnit: {
      type: String,
      required: [true, 'Please provide dosage unit (e.g., Tablet, mg, ml)'],
      trim: true,
      default: 'Tablet'
    },
    form: {
      type: String,
      enum: ['tablet', 'capsule', 'liquid', 'injection', 'inhaler', 'drops', 'topical', 'patch', 'other'],
      default: 'tablet'
    },
    color: {
      type: String,
      enum: ['blue', 'green', 'amber', 'rose', 'purple', 'emerald', 'indigo', 'teal', 'red', 'yellow'],
      default: 'blue'
    },
    instructions: {
      type: String,
      required: [true, 'Please provide intake instructions'],
      enum: [
        'Before food',
        'After food',
        'With food',
        'On empty stomach',
        'Before sleep',
        'Morning upon waking',
        'As needed',
        'Take with plenty of water'
      ],
      default: 'After food'
    },
    frequency: {
      type: String,
      enum: [
        'once_daily',
        'twice_daily',
        'three_times_daily',
        'four_times_daily',
        'every_x_hours',
        'as_needed',
        'custom_days'
      ],
      default: 'once_daily'
    },
    customDays: {
      type: [Number], // 0: Sunday, 1: Monday, ... 6: Saturday
      default: []
    },
    scheduleTimes: {
      type: [String], // Array of 24h format times, e.g. ["08:00", "20:00"]
      required: [true, 'Please provide at least one scheduled time'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one schedule time must be specified'
      }
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    prescribingDoctor: {
      type: String,
      trim: true,
      default: ''
    },
    stockQuantity: {
      type: Number,
      default: 30,
      min: [0, 'Stock cannot be negative']
    },
    refillAlertThreshold: {
      type: Number,
      default: 7
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isPaused: {
      type: Boolean,
      default: false
    },
    pausedReason: {
      type: String,
      trim: true,
      default: ''
    },
    reminderEnabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

medicineSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
