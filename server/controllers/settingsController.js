const NotificationSettings = require('../models/NotificationSettings');
const User = require('../models/User');

// @desc    Get current user settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await NotificationSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = await NotificationSettings.create({ user: req.user._id });
    }

    const user = await User.findById(req.user._id).select('preferences emergencyContact name email phone role');

    res.status(200).json({
      success: true,
      settings,
      preferences: user.preferences,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update notification settings
// @route   PUT /api/settings/notifications
// @access  Private
exports.updateNotificationSettings = async (req, res, next) => {
  try {
    let settings = await NotificationSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new NotificationSettings({ user: req.user._id });
    }

    const {
      browserNotificationsEnabled,
      soundEnabled,
      advanceReminderMinutes,
      snoozeDurationMinutes,
      missedDoseAlertCaregiver,
      voiceReadoutEnabled,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd
    } = req.body;

    if (browserNotificationsEnabled !== undefined) settings.browserNotificationsEnabled = browserNotificationsEnabled;
    if (soundEnabled !== undefined) settings.soundEnabled = soundEnabled;
    if (advanceReminderMinutes !== undefined) settings.advanceReminderMinutes = advanceReminderMinutes;
    if (snoozeDurationMinutes !== undefined) settings.snoozeDurationMinutes = snoozeDurationMinutes;
    if (missedDoseAlertCaregiver !== undefined) settings.missedDoseAlertCaregiver = missedDoseAlertCaregiver;
    if (voiceReadoutEnabled !== undefined) settings.voiceReadoutEnabled = voiceReadoutEnabled;
    if (quietHoursEnabled !== undefined) settings.quietHoursEnabled = quietHoursEnabled;
    if (quietHoursStart !== undefined) settings.quietHoursStart = quietHoursStart;
    if (quietHoursEnd !== undefined) settings.quietHoursEnd = quietHoursEnd;

    await settings.save();

    res.status(200).json({
      success: true,
      settings,
      message: 'Notification settings updated successfully!'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update accessibility preferences
// @route   PUT /api/settings/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const { fontSize, highContrast, voiceAssistance, theme } = req.body;

    const user = await User.findById(req.user._id);

    if (fontSize) user.preferences.fontSize = fontSize;
    if (highContrast !== undefined) user.preferences.highContrast = highContrast;
    if (voiceAssistance !== undefined) user.preferences.voiceAssistance = voiceAssistance;
    if (theme) user.preferences.theme = theme;

    await user.save();

    res.status(200).json({
      success: true,
      preferences: user.preferences,
      message: 'Accessibility preferences saved.'
    });
  } catch (err) {
    next(err);
  }
};
