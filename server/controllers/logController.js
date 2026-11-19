const DoseLog = require('../models/DoseLog');
const Medicine = require('../models/Medicine');
const { getTimeSlot, formatDate, createDateTime } = require('../utils/doseScheduler');

// @desc    Get medication logs with filters
// @route   GET /api/logs
// @access  Private
exports.getLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, status, medicineId, search, limit = 50, page = 1 } = req.query;

    const query = { user: req.effectiveUserId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (medicineId) {
      query.medicine = medicineId;
    }

    if (startDate && endDate) {
      query.scheduledDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.scheduledDate = { $gte: startDate };
    } else if (endDate) {
      query.scheduledDate = { $lte: endDate };
    }

    const total = await DoseLog.countDocuments(query);
    const logs = await DoseLog.find(query)
      .populate('medicine')
      .populate('loggedBy', 'name email role')
      .sort({ scheduledDateTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    // Optional text filter on populated medicine name if search query is provided
    let filteredLogs = logs;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = logs.filter(
        (log) =>
          log.medicine?.name?.toLowerCase().includes(searchLower) ||
          log.notes?.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      success: true,
      total,
      count: filteredLogs.length,
      page: parseInt(page, 10),
      data: filteredLogs
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logs grouped by date for calendar/history view
// @route   GET /api/logs/history
// @access  Private
exports.getLogHistory = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days, 10));

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    const logs = await DoseLog.find({
      user: req.effectiveUserId,
      scheduledDate: { $gte: startStr, $lte: endStr }
    })
      .populate('medicine')
      .sort({ scheduledDateTime: -1 });

    // Group logs by date
    const grouped = {};
    logs.forEach((log) => {
      const dateKey = log.scheduledDate;
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          total: 0,
          taken: 0,
          missed: 0,
          skipped: 0,
          pending: 0,
          doses: []
        };
      }
      grouped[dateKey].total += 1;
      grouped[dateKey][log.status] = (grouped[dateKey][log.status] || 0) + 1;
      grouped[dateKey].doses.push(log);
    });

    // Add adherence % per day
    const historyList = Object.values(grouped).map((dayGroup) => {
      const evaluated = dayGroup.taken + dayGroup.missed + dayGroup.skipped;
      dayGroup.adherencePercentage =
        evaluated > 0 ? Math.round((dayGroup.taken / evaluated) * 100) : 0;
      return dayGroup;
    });

    res.status(200).json({
      success: true,
      startDate: startStr,
      endDate: endStr,
      data: historyList
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create manual / PRN (as-needed) dose log
// @route   POST /api/logs
// @access  Private
exports.createManualLog = async (req, res, next) => {
  try {
    const { medicineId, scheduledDate, scheduledTime, dosage, dosageUnit, status, notes } = req.body;

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide medicine ID.'
      });
    }

    const medicine = await Medicine.findOne({
      _id: medicineId,
      user: req.effectiveUserId
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found.'
      });
    }

    const dateStr = scheduledDate || formatDate(new Date());
    const timeStr = scheduledTime || new Date().toTimeString().substring(0, 5);
    const scheduledDateTime = createDateTime(dateStr, timeStr);
    const timeSlot = getTimeSlot(timeStr);

    const dose = await DoseLog.create({
      user: req.effectiveUserId,
      medicine: medicine._id,
      scheduledDate: dateStr,
      scheduledTime: timeStr,
      scheduledDateTime,
      timeSlot,
      dosage: dosage || medicine.dosage,
      dosageUnit: dosageUnit || medicine.dosageUnit,
      status: status || 'taken',
      takenAt: status === 'taken' ? new Date() : null,
      loggedBy: req.user._id,
      notes: notes || 'As needed dose'
    });

    if (status === 'taken' && medicine.stockQuantity > 0) {
      await Medicine.findByIdAndUpdate(medicine._id, {
        $inc: { stockQuantity: -1 }
      });
    }

    const populated = await DoseLog.findById(dose._id).populate('medicine');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Medication dose logged successfully!'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a specific dose log
// @route   PUT /api/logs/:id
// @access  Private
exports.updateLog = async (req, res, next) => {
  try {
    const { status, notes, takenAt } = req.body;

    const dose = await DoseLog.findOne({
      _id: req.params.id,
      user: req.effectiveUserId
    }).populate('medicine');

    if (!dose) {
      return res.status(404).json({
        success: false,
        message: 'Log record not found.'
      });
    }

    const previousStatus = dose.status;
    if (status) dose.status = status;
    if (notes !== undefined) dose.notes = notes;
    if (takenAt !== undefined) dose.takenAt = takenAt ? new Date(takenAt) : null;

    if (status === 'taken' && previousStatus !== 'taken' && dose.medicine && dose.medicine.stockQuantity > 0) {
      await Medicine.findByIdAndUpdate(dose.medicine._id, { $inc: { stockQuantity: -1 } });
    } else if (previousStatus === 'taken' && status !== 'taken' && dose.medicine) {
      await Medicine.findByIdAndUpdate(dose.medicine._id, { $inc: { stockQuantity: 1 } });
    }

    await dose.save();
    const updated = await DoseLog.findById(dose._id).populate('medicine');

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Log updated successfully!'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a log record
// @route   DELETE /api/logs/:id
// @access  Private
exports.deleteLog = async (req, res, next) => {
  try {
    const dose = await DoseLog.findOneAndDelete({
      _id: req.params.id,
      user: req.effectiveUserId
    });

    if (!dose) {
      return res.status(404).json({
        success: false,
        message: 'Log record not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Log record removed.'
    });
  } catch (err) {
    next(err);
  }
};
