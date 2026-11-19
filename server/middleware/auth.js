const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CaregiverRelationship = require('../models/CaregiverRelationship');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_medicine_reminder_2026_elderly_care'
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    req.user = user;
    req.effectiveUserId = user._id;
    req.isCaregiverDelegation = false;

    // Check if caregiver is accessing on behalf of a patient
    const requestedPatientId = req.headers['x-patient-id'] || req.query.patientId;
    if (requestedPatientId && requestedPatientId !== user._id.toString()) {
      const relationship = await CaregiverRelationship.findOne({
        patient: requestedPatientId,
        caregiver: user._id,
        status: 'accepted'
      });

      if (!relationship) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have verified caregiver permission for this patient.'
        });
      }

      req.effectiveUserId = requestedPatientId;
      req.isCaregiverDelegation = true;
      req.caregiverPermissions = relationship.permissions;
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

module.exports = { protect };
