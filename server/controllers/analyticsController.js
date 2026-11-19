const DoseLog = require('../models/DoseLog');
const Medicine = require('../models/Medicine');
const { formatDate, ensureDosesForDate } = require('../utils/doseScheduler');

// Helper to get array of past N date strings
const getPastDateStrings = (numDays) => {
  const dates = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
};

// @desc    Get complete dashboard overview analytics
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const todayStr = formatDate(new Date());

    // Make sure today's doses exist
    await ensureDosesForDate(req.effectiveUserId, todayStr);

    // 1. Medicines count
    const totalMedicines = await Medicine.countDocuments({ user: req.effectiveUserId });
    const activeMedicines = await Medicine.countDocuments({
      user: req.effectiveUserId,
      isActive: true,
      isPaused: false
    });
    const lowStockMedicines = await Medicine.find({
      user: req.effectiveUserId,
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$refillAlertThreshold'] }
    });

    // 2. Today's stats
    const todayDoses = await DoseLog.find({
      user: req.effectiveUserId,
      scheduledDate: todayStr
    }).populate('medicine');

    const totalToday = todayDoses.length;
    const takenToday = todayDoses.filter((d) => d.status === 'taken').length;
    const pendingToday = todayDoses.filter((d) => d.status === 'pending').length;
    const missedToday = todayDoses.filter((d) => d.status === 'missed').length;
    const skippedToday = todayDoses.filter((d) => d.status === 'skipped').length;

    const evaluatedToday = takenToday + missedToday + skippedToday;
    const todayAdherence =
      evaluatedToday > 0 ? Math.round((takenToday / evaluatedToday) * 100) : (totalToday > 0 && takenToday === 0 && pendingToday === totalToday ? 100 : 0);

    // 3. Weekly trend (Last 7 days)
    const last7Days = getPastDateStrings(7);
    const weeklyLogs = await DoseLog.find({
      user: req.effectiveUserId,
      scheduledDate: { $in: last7Days }
    });

    const weeklyTrend = last7Days.map((dateStr) => {
      const d = new Date(dateStr + 'T12:00:00');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayLogs = weeklyLogs.filter((log) => log.scheduledDate === dateStr);

      const taken = dayLogs.filter((log) => log.status === 'taken').length;
      const missed = dayLogs.filter((log) => log.status === 'missed').length;
      const skipped = dayLogs.filter((log) => log.status === 'skipped').length;
      const pending = dayLogs.filter((log) => log.status === 'pending').length;
      const total = dayLogs.length;

      // Exclude future/pending doses from missed/adherence calculations
      const evaluated = taken + missed + skipped;
      const adherence = evaluated > 0 ? Math.round((taken / evaluated) * 100) : (total > 0 && pending === total ? 100 : 0);

      return {
        date: dateStr,
        dayName,
        total,
        taken,
        missed,
        skipped,
        pending,
        adherence
      };
    });

    // Calculate weekly average adherence
    const weeklyEvaluatedDays = weeklyTrend.filter((day) => day.taken + day.missed + day.skipped > 0);
    const weeklyAvgAdherence =
      weeklyEvaluatedDays.length > 0
        ? Math.round(
            weeklyEvaluatedDays.reduce((acc, curr) => acc + curr.adherence, 0) /
              weeklyEvaluatedDays.length
          )
        : todayAdherence;

    // 4. Medicine-wise stats over last 30 days
    const past30Days = getPastDateStrings(30);
    const past30Logs = await DoseLog.find({
      user: req.effectiveUserId,
      scheduledDate: { $in: past30Days }
    }).populate('medicine');

    const medMap = {};
    past30Logs.forEach((log) => {
      if (!log.medicine) return;
      const medId = log.medicine._id.toString();
      if (!medMap[medId]) {
        medMap[medId] = {
          id: medId,
          name: log.medicine.name,
          color: log.medicine.color || 'blue',
          dosage: `${log.medicine.dosage} ${log.medicine.dosageUnit}`,
          total: 0,
          taken: 0,
          missed: 0,
          skipped: 0
        };
      }
      medMap[medId].total += 1;
      if (log.status === 'taken') medMap[medId].taken += 1;
      if (log.status === 'missed') medMap[medId].missed += 1;
      if (log.status === 'skipped') medMap[medId].skipped += 1;
    });

    const medicineStats = Object.values(medMap).map((med) => {
      const evalCount = med.taken + med.missed + med.skipped;
      med.adherence = evalCount > 0 ? Math.round((med.taken / evalCount) * 100) : 100;
      return med;
    });

    // 5. Adherence Streak: count consecutive days backwards with adherence >= 80%
    let streak = 0;
    for (let i = weeklyTrend.length - 1; i >= 0; i--) {
      const day = weeklyTrend[i];
      if (day.date === todayStr && day.taken === 0 && day.pending > 0) {
        // If today has pending doses and hasn't started or is in progress, check previous days
        continue;
      }
      if (day.adherence >= 80) {
        streak += 1;
      } else {
        break;
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalMedicines,
        activeMedicines,
        lowStockMedicinesCount: lowStockMedicines.length,
        today: {
          total: totalToday,
          taken: takenToday,
          pending: pendingToday,
          missed: missedToday,
          skipped: skippedToday,
          adherence: todayAdherence
        },
        weeklyAvgAdherence,
        streak
      },
      lowStockMedicines,
      weeklyTrend,
      medicineStats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get weekly adherence analytics
// @route   GET /api/analytics/weekly
// @access  Private
exports.getWeeklyAnalytics = async (req, res, next) => {
  try {
    const dates = getPastDateStrings(7);
    const logs = await DoseLog.find({
      user: req.effectiveUserId,
      scheduledDate: { $in: dates }
    }).populate('medicine');

    const dailyBreakdown = dates.map((dateStr) => {
      const d = new Date(dateStr + 'T12:00:00');
      const dayLogs = logs.filter((l) => l.scheduledDate === dateStr);
      const taken = dayLogs.filter((l) => l.status === 'taken').length;
      const missed = dayLogs.filter((l) => l.status === 'missed').length;
      const skipped = dayLogs.filter((l) => l.status === 'skipped').length;
      const total = dayLogs.length;
      const evaluated = taken + missed + skipped;

      return {
        date: dateStr,
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' }),
        total,
        taken,
        missed,
        skipped,
        adherence: evaluated > 0 ? Math.round((taken / evaluated) * 100) : 0
      };
    });

    res.status(200).json({
      success: true,
      data: dailyBreakdown
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get monthly adherence analytics
// @route   GET /api/analytics/monthly
// @access  Private
exports.getMonthlyAnalytics = async (req, res, next) => {
  try {
    const dates = getPastDateStrings(30);
    const logs = await DoseLog.find({
      user: req.effectiveUserId,
      scheduledDate: { $in: dates }
    }).populate('medicine');

    let totalTaken = 0;
    let totalMissed = 0;
    let totalSkipped = 0;

    const trend = dates.map((dateStr) => {
      const dayLogs = logs.filter((l) => l.scheduledDate === dateStr);
      const taken = dayLogs.filter((l) => l.status === 'taken').length;
      const missed = dayLogs.filter((l) => l.status === 'missed').length;
      const skipped = dayLogs.filter((l) => l.status === 'skipped').length;
      const total = dayLogs.length;

      totalTaken += taken;
      totalMissed += missed;
      totalSkipped += skipped;

      const evalCount = taken + missed + skipped;
      return {
        date: dateStr,
        total,
        taken,
        missed,
        skipped,
        adherence: evalCount > 0 ? Math.round((taken / evalCount) * 100) : 0
      };
    });

    const evaluatedTotal = totalTaken + totalMissed + totalSkipped;
    const monthlyAdherence =
      evaluatedTotal > 0 ? Math.round((totalTaken / evaluatedTotal) * 100) : 0;

    res.status(200).json({
      success: true,
      monthlyAdherence,
      totalTaken,
      totalMissed,
      totalSkipped,
      trend
    });
  } catch (err) {
    next(err);
  }
};
