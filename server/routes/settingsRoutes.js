const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateNotificationSettings,
  updatePreferences
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getSettings);
router.put('/notifications', updateNotificationSettings);
router.put('/preferences', updatePreferences);

module.exports = router;
