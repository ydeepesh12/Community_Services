const DoseLog = require('../models/DoseLog');
const Medicine = require('../models/Medicine');
const { ensureDosesForDate, formatDate } = require('../utils/doseScheduler');

// Helper to group doses by time slot
const groupDosesBySlot = (doses) => {
  const groups = {
    morning: [],
    afternoon: [],
    evening: [],
    night: []
  };

  doses.forEach((dose) => {
    if (groups[dose.timeSlot]) {
      groups[dose.timeSlot].push(dose);
    } else {
      groups.night.push(dose);
    }
  });

  return groups;
};

// Helper to calculate adherence statistics for a list of doses
const calculateDoseStats = (doses) => {
  const total = doses.length;
  const taken = doses.filter((d) => d.status === 'taken').length;
  const pending = doses.filter((d) => d.status === 'pending').length;
  const missed = doses.filter((d) => d.status === 'missed').length;
  const skipped = doses.filter((d) => d.status === 'skipped').length;

  // Past doses eligible for adherence score (excluding future pending doses)
  const evaluatedDoses = taken + missed + skipped;
  const adherence = evaluatedDoses > 0 ? Math.round((taken / evaluatedDoses) * 100) : (total > 0 && taken === 0 && pending === total ? 100 : 0);

  return {
    total,
    taken,
    pending,
    missed,
    skipped,
    adherencePercentage: adherence
  };
};

// @desc    Get today's medication schedule categorized by slot
// @route   GET /api/schedules/today
// @access  Private
exports.getTodaySchedule = async (req, res, next) => {
  try {
    const todayStr = formatDate(new Date());
    const doses = await ensureDosesForDate(req.effectiveUserId, todayStr);
    const slots = groupDosesBySlot(doses);
    const stats = calculateDoseStats(doses);

    res.status(200).json({
      success: true,
      date: todayStr,
      stats,
      slots,
      allDoses: doses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get medication schedule for any specific date
// @route   GET /api/schedules
// @access  Private
exports.getScheduleByDate = async (req, res, next) => {
  try {
    const targetDateStr = req.query.date || formatDate(new Date());
    const doses = await ensureDosesForDate(req.effectiveUserId, targetDateStr);
    const slots = groupDosesBySlot(doses);
    const stats = calculateDoseStats(doses);

    res.status(200).json({
      success: true,
      date: targetDateStr,
      stats,
      slots,
      allDoses: doses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update dose status (taken, missed, skipped, pending)
// @route   PUT /api/schedules/:id/status
// @access  Private
exports.updateDoseStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!['pending', 'taken', 'missed', 'skipped'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, taken, missed, or skipped.'
      });
    }

    const dose = await DoseLog.findOne({
      _id: req.params.id,
      user: req.effectiveUserId
    }).populate('medicine');

    if (!dose) {
      return res.status(404).json({
        success: false,
        message: 'Dose log not found.'
      });
    }

    const previousStatus = dose.status;
    dose.status = status;
    if (notes !== undefined) dose.notes = notes;

    if (status === 'taken') {
      dose.takenAt = new Date();
      dose.loggedBy = req.user._id;

      // Deduct medicine stock if not previously taken
      if (previousStatus !== 'taken' && dose.medicine && dose.medicine.stockQuantity > 0) {
        await Medicine.findByIdAndUpdate(dose.medicine._id, {
          $inc: { stockQuantity: -1 }
        });
      }
    } else {
      dose.takenAt = null;
      // Revert stock deduction if dose was previously marked taken
      if (previousStatus === 'taken' && dose.medicine) {
        await Medicine.findByIdAndUpdate(dose.medicine._id, {
          $inc: { stockQuantity: 1 }
        });
      }
    }

    await dose.save();

    // Reload with updated medicine details
    const updatedDose = await DoseLog.findById(dose._id).populate('medicine');

    res.status(200).json({
      success: true,
      data: updatedDose,
      message: `Dose marked as ${status}.`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Snooze dose reminder
// @route   POST /api/schedules/:id/snooze
// @access  Private
exports.snoozeDose = async (req, res, next) => {
  try {
    const minutes = parseInt(req.body.minutes || 10, 10);

    const dose = await DoseLog.findOne({
      _id: req.params.id,
      user: req.effectiveUserId
    });

    if (!dose) {
      return res.status(404).json({
        success: false,
        message: 'Dose not found.'
      });
    }

    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
    dose.snoozedUntil = snoozedUntil;
    await dose.save();

    res.status(200).json({
      success: true,
      snoozedUntil,
      message: `Reminder snoozed for ${minutes} minutes.`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get upcoming reminders
// @route   GET /api/schedules/upcoming
// @access  Private
exports.getUpcomingReminders = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStr = formatDate(now);
    await ensureDosesForDate(req.effectiveUserId, todayStr);

    // Get pending doses from 30 minutes ago to 12 hours from now
    const pastWindow = new Date(now.getTime() - 30 * 60 * 1000);
    const futureWindow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const upcomingDoses = await DoseLog.find({
      user: req.effectiveUserId,
      status: 'pending',
      scheduledDateTime: { $gte: pastWindow, $lte: futureWindow }
    })
      .populate('medicine')
      .sort({ scheduledDateTime: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: upcomingDoses.length,
      data: upcomingDoses
    });
  } catch (err) {
    next(err);
  }
};
