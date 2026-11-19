const mongoose = require('mongoose');

const caregiverRelationshipSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    inviteCode: {
      type: String,
      unique: true,
      trim: true,
      index: true
    },
    relationship: {
      type: String,
      trim: true,
      default: 'Family Caregiver'
    },
    permissions: {
      canView: {
        type: Boolean,
        default: true
      },
      canLogDose: {
        type: Boolean,
        default: true
      },
      canEditMedicines: {
        type: Boolean,
        default: false
      }
    },
    inviteExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  },
  {
    timestamps: true
  }
);

caregiverRelationshipSchema.index({ patient: 1, caregiver: 1 });

module.exports = mongoose.model('CaregiverRelationship', caregiverRelationshipSchema);
