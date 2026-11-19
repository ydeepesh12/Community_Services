const mongoose = require('mongoose');

const doseLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true
    },
    scheduledDate: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true
    },
    scheduledTime: {
      type: String, // Format: HH:mm (24-hour)
      required: true
    },
    scheduledDateTime: {
      type: Date,
      required: true,
      index: true
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    dosageUnit: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'taken', 'missed', 'skipped'],
      default: 'pending',
      index: true
    },
    takenAt: {
      type: Date,
      default: null
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    snoozedUntil: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate dose schedules for the same user, medicine, date and time
doseLogSchema.index(
  { user: 1, medicine: 1, scheduledDate: 1, scheduledTime: 1 },
  { unique: true }
);

doseLogSchema.index({ user: 1, scheduledDate: 1, status: 1 });
doseLogSchema.index({ user: 1, status: 1, scheduledDateTime: 1 });

module.exports = mongoose.model('DoseLog', doseLogSchema);
