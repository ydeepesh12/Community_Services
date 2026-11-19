const Medicine = require('../models/Medicine');
const DoseLog = require('../models/DoseLog');
const { ensureDosesForDate, formatDate } = require('../utils/doseScheduler');

// @desc    Get all medicines for the active patient
// @route   GET /api/medicines
// @access  Private
exports.getMedicines = async (req, res, next) => {
  try {
    const { search, status, form, frequency } = req.query;

    const query = { user: req.effectiveUserId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { prescribingDoctor: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      query.isActive = true;
      query.isPaused = false;
    } else if (status === 'paused') {
      query.isPaused = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (form) {
      query.form = form;
    }

    if (frequency) {
      query.frequency = frequency;
    }

    const medicines = await Medicine.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single medicine by ID
// @route   GET /api/medicines/:id
// @access  Private
exports.getMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      user: req.effectiveUserId
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found or access denied.'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new medicine
// @route   POST /api/medicines
// @access  Private
exports.createMedicine = async (req, res, next) => {
  try {
    // If caregiver action, check permissions
    if (req.isCaregiverDelegation && !req.caregiverPermissions?.canEditMedicines) {
      return res.status(403).json({
        success: false,
        message: 'Your caregiver role does not have permission to add or modify medicines.'
      });
    }

    const {
      name,
      genericName,
      dosage,
      dosageUnit,
      form,
      color,
      instructions,
      frequency,
      customDays,
      scheduleTimes,
      startDate,
      endDate,
      prescribingDoctor,
      stockQuantity,
      refillAlertThreshold,
      notes
    } = req.body;

    if (!name || !dosage || !scheduleTimes || scheduleTimes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide medicine name, dosage, and at least one scheduled time.'
      });
    }

    const medicine = await Medicine.create({
      user: req.effectiveUserId,
      name,
      genericName: genericName || '',
      dosage,
      dosageUnit: dosageUnit || 'Tablet',
      form: form || 'tablet',
      color: color || 'blue',
      instructions: instructions || 'After food',
      frequency: frequency || 'once_daily',
      customDays: customDays || [],
      scheduleTimes,
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      prescribingDoctor: prescribingDoctor || '',
      stockQuantity: stockQuantity !== undefined ? stockQuantity : 30,
      refillAlertThreshold: refillAlertThreshold !== undefined ? refillAlertThreshold : 7,
      notes: notes || ''
    });

    // Automatically generate today's doses for immediate availability in schedule
    const todayStr = formatDate(new Date());
    await ensureDosesForDate(req.effectiveUserId, todayStr);

    res.status(201).json({
      success: true,
      data: medicine,
      message: `${medicine.name} added to schedule successfully!`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private
exports.updateMedicine = async (req, res, next) => {
  try {
    if (req.isCaregiverDelegation && !req.caregiverPermissions?.canEditMedicines) {
      return res.status(403).json({
        success: false,
        message: 'Your caregiver role does not have permission to edit medicines.'
      });
    }

    let medicine = await Medicine.findOne({
      _id: req.params.id,
      user: req.effectiveUserId
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found or access denied.'
      });
    }

    medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Refresh today's doses to reflect any updated schedule
    const todayStr = formatDate(new Date());
    await ensureDosesForDate(req.effectiveUserId, todayStr);

    res.status(200).json({
      success: true,
      data: medicine,
      message: 'Medicine updated successfully!'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private
exports.deleteMedicine = async (req, res, next) => {
  try {
    if (req.isCaregiverDelegation && !req.caregiverPermissions?.canEditMedicines) {
      return res.status(403).json({
        success: false,
        message: 'Your caregiver role does not have permission to delete medicines.'
      });
    }

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      user: req.effectiveUserId
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found or access denied.'
      });
    }

    await Medicine.findByIdAndDelete(req.params.id);

    // Remove future pending doses for this medicine
    const now = new Date();
    await DoseLog.deleteMany({
      medicine: req.params.id,
      status: 'pending',
      scheduledDateTime: { $gte: now }
    });

    res.status(200).json({
      success: true,
      message: `${medicine.name} has been removed.`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Pause or resume medicine
// @route   PATCH /api/medicines/:id/pause
// @access  Private
exports.togglePauseMedicine = async (req, res, next) => {
  try {
    const { isPaused, reason } = req.body;

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      user: req.effectiveUserId
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found.'
      });
    }

    medicine.isPaused = isPaused;
    medicine.pausedReason = isPaused ? (reason || 'Paused by user') : '';
    await medicine.save();

    if (isPaused) {
      // Clean up future pending doses while paused
      const now = new Date();
      await DoseLog.deleteMany({
        medicine: medicine._id,
        status: 'pending',
        scheduledDateTime: { $gte: now }
      });
    } else {
      // Resumed: re-generate today's doses
      const todayStr = formatDate(new Date());
      await ensureDosesForDate(req.effectiveUserId, todayStr);
    }

    res.status(200).json({
      success: true,
      data: medicine,
      message: `${medicine.name} is now ${isPaused ? 'paused' : 'resumed'}.`
    });
  } catch (err) {
    next(err);
  }
};
