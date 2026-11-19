import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useReminder } from '../context/ReminderContext';
import api from '../services/api';
import {
  Settings,
  User,
  Shield,
  Bell,
  Volume2,
  Eye,
  Lock,
  PhoneCall,
  Save,
  Check,
  AlertTriangle,
  Info,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { fontSize, setFontSize, highContrast, setHighContrast, voiceEnabled, setVoiceEnabled, updatePreferences } =
    useAccessibility();
  const { notificationPermission, requestPermission, testReminder } = useReminder();

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    emergencyContact: {
      name: user?.emergencyContact?.name || '',
      phone: user?.emergencyContact?.phone || '',
      relationship: user?.emergencyContact?.relationship || ''
    }
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Notification Settings Form
  const [notificationConfig, setNotificationConfig] = useState({
    soundEnabled: true,
    snoozeDurationMinutes: 10,
    advanceReminderMinutes: 0,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success && res.data.settings) {
        setNotificationConfig({
          soundEnabled: res.data.settings.soundEnabled,
          snoozeDurationMinutes: res.data.settings.snoozeDurationMinutes || 10,
          advanceReminderMinutes: res.data.settings.advanceReminderMinutes || 0,
          quietHoursEnabled: res.data.settings.quietHoursEnabled || false,
          quietHoursStart: res.data.settings.quietHoursStart || '22:00',
          quietHoursEnd: res.data.settings.quietHoursEnd || '07:00'
        });
      }
    } catch (err) {
      console.warn('Could not load settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');

    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data.success) {
        setProfileMessage('Profile information saved successfully!');
        await refreshUser();
      }
    } catch (err) {
      setProfileMessage('Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.data.success) {
        setPasswordMessage('Password successfully changed!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setNotifSaving(true);
    setNotifMessage('');

    try {
      const res = await api.put('/settings/notifications', notificationConfig);
      if (res.data.success) {
        setNotifMessage('Notification preferences updated!');
      }
    } catch (err) {
      setNotifMessage('Failed to update notification settings.');
    } finally {
      setNotifSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Application Settings & Preferences
        </h2>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          Customize elderly accessibility, reminder chime alerts, emergency contacts and account security.
        </p>
      </div>

      {/* 1. Accessibility & Visual Display Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-2xl bg-sky-100 text-primary-600">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Elderly Accessibility & Typography</h3>
            <p className="text-xs text-slate-500">
              Enlarge text sizing and increase contrast for effortless reading.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {/* Font Size Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Text & Display Sizing
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFontSize('normal');
                  updatePreferences({ fontSize: 'normal' });
                }}
                className={`py-3 px-4 rounded-2xl border-2 text-center font-bold text-sm transition-all ${
                  fontSize === 'normal'
                    ? 'border-primary-600 bg-primary-50 text-primary-800 shadow-xs'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Normal (16px)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFontSize('large');
                  updatePreferences({ fontSize: 'large' });
                }}
                className={`py-3 px-4 rounded-2xl border-2 text-center font-bold text-base transition-all ${
                  fontSize === 'large'
                    ? 'border-primary-600 bg-primary-50 text-primary-800 shadow-xs'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Large (18px)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFontSize('extra-large');
                  updatePreferences({ fontSize: 'extra-large' });
                }}
                className={`py-3 px-4 rounded-2xl border-2 text-center font-bold text-lg transition-all ${
                  fontSize === 'extra-large'
                    ? 'border-primary-600 bg-primary-50 text-primary-800 shadow-xs'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Extra Large (20px)
              </button>
            </div>
          </div>

          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-sm text-slate-900">High Contrast Mode</p>
              <p className="text-xs text-slate-500">
                Enhances border contrast and sharpens text for elderly eyes or visual impairments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !highContrast;
                setHighContrast(nextVal);
                updatePreferences({ highContrast: nextVal });
              }}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${
                highContrast ? 'bg-primary-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Voice Reading Assistance Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-sm text-slate-900">Spoken Voice Assistance</p>
              <p className="text-xs text-slate-500">
                Reads medication names, dosages, and instructions aloud via audio speech synthesis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !voiceEnabled;
                setVoiceEnabled(nextVal);
                updatePreferences({ voiceAssistance: nextVal });
              }}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${
                voiceEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  voiceEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Notification & Reminder Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Reminders & Browser Alerts</h3>
            <p className="text-xs text-slate-500">
              Configure reminder notifications, chime volume, and snooze durations.
            </p>
          </div>
        </div>

        {/* Browser Notification Limitation Box (as requested in spec #9) */}
        <div className="mt-4 p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 space-y-1.5">
          <div className="flex items-center space-x-2 font-bold text-sm text-blue-950">
            <Info className="w-4 h-4 text-blue-700" />
            <span>Browser Notification Notice</span>
          </div>
          <p className="leading-relaxed">
            Browser notifications provide real-time alerts while MedRemind is open in any active or background browser tab. When the browser is completely closed or your device is asleep, desktop browser APIs cannot fire universal alerts without an operating system service worker or native SMS gateway. Keep MedRemind tab open for reliable timely reminders.
          </p>
        </div>

        <form onSubmit={handleSaveNotifications} className="mt-5 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-sm text-slate-900">Browser Desktop Notifications</p>
              <p className="text-xs text-slate-500">
                Current status: <strong className="capitalize">{notificationPermission}</strong>
              </p>
            </div>
            {notificationPermission !== 'granted' ? (
              <button
                type="button"
                onClick={requestPermission}
                className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                Enable Permission
              </button>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Allowed</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-sm text-slate-900">Soothing Audio Chime</p>
              <p className="text-xs text-slate-500">
                Plays a gentle melodic 3-tone chime when a medicine is due.
              </p>
            </div>
            <button
              type="button"
              onClick={testReminder}
              className="py-2 px-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center space-x-1.5"
            >
              <Volume2 className="w-4 h-4 text-primary-600" />
              <span>Test Chime</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Default Snooze Duration
              </label>
              <select
                value={notificationConfig.snoozeDurationMinutes}
                onChange={(e) =>
                  setNotificationConfig({
                    ...notificationConfig,
                    snoozeDurationMinutes: parseInt(e.target.value, 10)
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Advance Reminder
              </label>
              <select
                value={notificationConfig.advanceReminderMinutes}
                onChange={(e) =>
                  setNotificationConfig({
                    ...notificationConfig,
                    advanceReminderMinutes: parseInt(e.target.value, 10)
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              >
                <option value={0}>At scheduled time</option>
                <option value={5}>5 minutes early</option>
                <option value={10}>10 minutes early</option>
                <option value={15}>15 minutes early</option>
              </select>
            </div>
          </div>

          {notifMessage && (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl">
              {notifMessage}
            </p>
          )}

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={notifSaving}
              className="py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-xs"
            >
              {notifSaving ? 'Saving...' : 'Save Notification Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. User Profile & Emergency Contact */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Profile & Emergency Contacts</h3>
            <p className="text-xs text-slate-500">
              Keep personal information and emergency phone numbers updated.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Your Phone Number
              </label>
              <input
                type="text"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="e.g., +1 (555) 234-5678"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
            <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold uppercase">
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span>Primary Emergency Contact</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={profileData.emergencyContact.name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      emergencyContact: { ...profileData.emergencyContact, name: e.target.value }
                    })
                  }
                  placeholder="e.g., Mark Vance"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={profileData.emergencyContact.phone}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      emergencyContact: { ...profileData.emergencyContact, phone: e.target.value }
                    })
                  }
                  placeholder="e.g., +1 (555) 987-6543"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={profileData.emergencyContact.relationship}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      emergencyContact: {
                        ...profileData.emergencyContact,
                        relationship: e.target.value
                      }
                    })
                  }
                  placeholder="e.g., Son, Daughter, Doctor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                />
              </div>
            </div>
          </div>

          {profileMessage && (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl">
              {profileMessage}
            </p>
          )}

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={profileSaving}
              className="py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-xs"
            >
              {profileSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Security & Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
            <p className="text-xs text-slate-500">
              Ensure your account is protected with a secure password.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              />
            </div>
          </div>

          {passwordError && (
            <p className="text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl">
              {passwordError}
            </p>
          )}

          {passwordMessage && (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl">
              {passwordMessage}
            </p>
          )}

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={passwordSaving}
              className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* 5. Logout */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={logout}
          className="py-3 px-6 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-sm border border-rose-200 flex items-center space-x-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of MedRemind</span>
        </button>
      </div>
    </div>
  );
}
