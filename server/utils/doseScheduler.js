const Medicine = require('../models/Medicine');
const DoseLog = require('../models/DoseLog');

/**
 * Categorize time (HH:mm) into elderly-friendly time slots:
 * Morning: 05:00 - 11:59
 * Afternoon: 12:00 - 16:59
 * Evening: 17:00 - 20:59
 * Night: 21:00 - 04:59
 */
const getTimeSlot = (timeString) => {
  const [hourStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Helper to format Date to YYYY-MM-DD in local time
 */
const formatDate = (d) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Combine YYYY-MM-DD and HH:mm into a Date object
 */
const createDateTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, min, 0, 0);
};

/**
 * Ensure doses are generated for a given user on a specific date (YYYY-MM-DD).
 * Idempotent: Never overwrites already taken, skipped, or logged doses.
 */
const ensureDosesForDate = async (userId, targetDateStr) => {
  const [year, month, day] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day, 12, 0, 0);
  const dayOfWeek = targetDate.getDay(); // 0: Sun, 1: Mon, ... 6: Sat

  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  // Find all active, unpaused medicines for this user covering this date
  const medicines = await Medicine.find({
    user: userId,
    isActive: true,
    isPaused: false,
    startDate: { $lte: endOfDay },
    $or: [{ endDate: null }, { endDate: { $gte: startOfDay } }]
  });

  const now = new Date();
  const operations = [];

  for (const med of medicines) {
    // If custom_days, check if today is included
    if (med.frequency === 'custom_days' && Array.isArray(med.customDays)) {
      if (!med.customDays.includes(dayOfWeek)) {
        continue;
      }
    }

    for (const timeStr of med.scheduleTimes) {
      const scheduledDateTime = createDateTime(targetDateStr, timeStr);
      const timeSlot = getTimeSlot(timeStr);

      // We use findOneAndUpdate with upsert or insert-if-not-exists
      // To preserve existing status, we only setOnInsert for fields
      operations.push({
        updateOne: {
          filter: {
            user: userId,
            medicine: med._id,
            scheduledDate: targetDateStr,
            scheduledTime: timeStr
          },
          update: {
            $setOnInsert: {
              user: userId,
              medicine: med._id,
              scheduledDate: targetDateStr,
              scheduledTime: timeStr,
              scheduledDateTime,
              timeSlot,
              dosage: med.dosage,
              dosageUnit: med.dosageUnit,
              status: 'pending',
              takenAt: null,
              notes: ''
            }
          },
          upsert: true
        }
      });
    }
  }

  if (operations.length > 0) {
    try {
      await DoseLog.bulkWrite(operations, { ordered: false });
    } catch (err) {
      // Ignore duplicate key errors in case of concurrency
      if (err.code !== 11000) {
        console.error('[doseScheduler bulkWrite error]', err.message);
      }
    }
  }

  // Update past pending doses to 'missed' if scheduledDateTime is > 2 hours in the past
  // and the date is in the past or today earlier
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  await DoseLog.updateMany(
    {
      user: userId,
      scheduledDate: targetDateStr,
      status: 'pending',
      scheduledDateTime: { $lt: twoHoursAgo }
    },
    {
      $set: { status: 'missed' }
    }
  );

  // Return populated doses for this date
  const doses = await DoseLog.find({
    user: userId,
    scheduledDate: targetDateStr
  })
    .populate('medicine')
    .sort({ scheduledDateTime: 1 });

  return doses;
};

module.exports = {
  getTimeSlot,
  formatDate,
  createDateTime,
  ensureDosesForDate
};
