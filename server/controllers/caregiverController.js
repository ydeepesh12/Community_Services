const crypto = require('crypto');
const CaregiverRelationship = require('../models/CaregiverRelationship');
const User = require('../models/User');

// Helper to generate human-readable invite code e.g. "CARE-84920"
const createInviteCode = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CARE-${randomNum}`;
};

// @desc    Generate a new caregiver invite link / code
// @route   POST /api/caregivers/invite
// @access  Private (Patient)
exports.generateInviteCode = async (req, res, next) => {
  try {
    const { relationship, permissions } = req.body;

    const inviteCode = createInviteCode();

    const invite = await CaregiverRelationship.create({
      patient: req.user._id,
      inviteCode,
      relationship: relationship || 'Family Caregiver',
      permissions: permissions || {
        canView: true,
        canLogDose: true,
        canEditMedicines: false
      },
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: invite,
      inviteCode,
      message: `Invite code ${inviteCode} generated! Share this code with your family member or caregiver.`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Link caregiver to a patient using invite code
// @route   POST /api/caregivers/link
// @access  Private (Caregiver)
exports.linkWithCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the invite code.'
      });
    }

    const relationship = await CaregiverRelationship.findOne({
      inviteCode: inviteCode.trim().toUpperCase()
    }).populate('patient', 'name email phone avatar');

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code. Please check and try again.'
      });
    }

    if (relationship.patient._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot be a caregiver for yourself.'
      });
    }

    if (relationship.status === 'accepted' && relationship.caregiver) {
      return res.status(400).json({
        success: false,
        message: 'This invite code has already been used.'
      });
    }

    relationship.caregiver = req.user._id;
    relationship.status = 'accepted';
    await relationship.save();

    res.status(200).json({
      success: true,
      data: relationship,
      message: `You are now linked as a caregiver for ${relationship.patient.name}!`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get caregivers for patient, or patients for caregiver
// @route   GET /api/caregivers
// @access  Private
exports.getRelationships = async (req, res, next) => {
  try {
    // 1. If user is patient: get all caregivers linked to this patient
    const caregivers = await CaregiverRelationship.find({
      patient: req.user._id
    }).populate('caregiver', 'name email phone avatar role');

    // 2. If user is caregiver or has patients: get patients they care for
    const patients = await CaregiverRelationship.find({
      caregiver: req.user._id,
      status: 'accepted'
    }).populate('patient', 'name email phone avatar emergencyContact preferences');

    res.status(200).json({
      success: true,
      role: req.user.role,
      caregivers,
      patients: patients.map((p) => ({
        relationshipId: p._id,
        patient: p.patient,
        relationship: p.relationship,
        permissions: p.permissions
      }))
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update caregiver permissions (Patient only)
// @route   PUT /api/caregivers/:id
// @access  Private
exports.updatePermissions = async (req, res, next) => {
  try {
    const { permissions, relationship } = req.body;

    const rel = await CaregiverRelationship.findOne({
      _id: req.params.id,
      patient: req.user._id
    });

    if (!rel) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver relationship not found.'
      });
    }

    if (permissions) rel.permissions = permissions;
    if (relationship) rel.relationship = relationship;

    await rel.save();

    res.status(200).json({
      success: true,
      data: rel,
      message: 'Caregiver permissions updated successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove or cancel caregiver link
// @route   DELETE /api/caregivers/:id
// @access  Private
exports.removeRelationship = async (req, res, next) => {
  try {
    const rel = await CaregiverRelationship.findOne({
      _id: req.params.id,
      $or: [{ patient: req.user._id }, { caregiver: req.user._id }]
    });

    if (!rel) {
      return res.status(404).json({
        success: false,
        message: 'Relationship record not found.'
      });
    }

    await CaregiverRelationship.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Caregiver relationship successfully removed.'
    });
  } catch (err) {
    next(err);
  }
};
