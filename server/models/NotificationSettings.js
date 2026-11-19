const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    browserNotificationsEnabled: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    advanceReminderMinutes: {
      type: Number,
      enum: [0, 5, 10, 15, 30],
      default: 0
    },
    snoozeDurationMinutes: {
      type: Number,
      enum: [5, 10, 15, 20, 30],
      default: 10
    },
    missedDoseAlertCaregiver: {
      type: Boolean,
      default: true
    },
    voiceReadoutEnabled: {
      type: Boolean,
      default: true
    },
    quietHoursEnabled: {
      type: Boolean,
      default: false
    },
    quietHoursStart: {
      type: String,
      default: '22:00'
    },
    quietHoursEnd: {
      type: String,
      default: '07:00'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);
