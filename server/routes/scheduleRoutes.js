const express = require('express');
const router = express.Router();
const {
  getTodaySchedule,
  getScheduleByDate,
  updateDoseStatus,
  snoozeDose,
  getUpcomingReminders
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/today', getTodaySchedule);
router.get('/', getScheduleByDate);
router.get('/upcoming', getUpcomingReminders);
router.put('/:id/status', updateDoseStatus);
router.post('/:id/snooze', snoozeDose);

module.exports = router;
