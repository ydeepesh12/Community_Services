import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { playReminderChime, playDoseTakenChime, speakMedicationInstruction } from '../utils/soundEffects';
import { useAccessibility } from './AccessibilityContext';
import { useAuth } from './AuthContext';

const ReminderContext = createContext();

export const ReminderProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { voiceEnabled } = useAccessibility();

  const [notificationPermission, setNotificationPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';
  });

  const [activeAlertDose, setActiveAlertDose] = useState(null);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [lastAlertedDoseId, setLastAlertedDoseId] = useState(null);
  const alertedDoseMapRef = useRef(new Set());

  // Request browser permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  };

  // Poll for upcoming reminders & check if any dose is due right now
  const checkDueReminders = async () => {
    if (!isAuthenticated) return;

    try {
      const res = await api.get('/schedules/upcoming');
      if (res.data.success && Array.isArray(res.data.data)) {
        const doses = res.data.data;
        setUpcomingReminders(doses);

        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMins = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMins}`;

        // Find dose whose scheduledTime matches or is due right now
        for (const dose of doses) {
          if (dose.status !== 'pending') continue;

          // Check if snoozed
          if (dose.snoozedUntil && new Date(dose.snoozedUntil) > now) {
            continue;
          }

          const scheduledTime = dose.scheduledTime;
          const scheduledDateTime = new Date(dose.scheduledDateTime);
          const diffMinutes = (now.getTime() - scheduledDateTime.getTime()) / 60000;

          // Trigger if scheduled time is reached (within a 15-minute window) and not yet alerted in this session
          const alertKey = `${dose._id}_${dose.scheduledDate}_${dose.scheduledTime}`;
          if (diffMinutes >= 0 && diffMinutes <= 15 && !alertedDoseMapRef.current.has(alertKey)) {
            alertedDoseMapRef.current.add(alertKey);
            triggerAlert(dose);
            break;
          }
        }
      }
    } catch (err) {
      // Ignore network errors in polling
      console.warn('[Reminder Poll Error]:', err.message);
    }
  };

  const triggerAlert = (dose) => {
    setActiveAlertDose(dose);
    setLastAlertedDoseId(dose._id);

    // 1. Play melodic chime
    playReminderChime();

    // 2. Browser Desktop Notification (if allowed)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const title = `💊 Reminder: Time for ${dose.medicine?.name || 'Medicine'}`;
        const options = {
          body: `Dose: ${dose.dosage} ${dose.dosageUnit} • ${dose.medicine?.instructions || 'Take now'}`,
          icon: '/favicon.ico',
          tag: dose._id,
          requireInteraction: true
        };
        new Notification(title, options);
      } catch (e) {
        console.warn('Desktop notification failed:', e);
      }
    }

    // 3. Spoken voice announcement
    if (voiceEnabled && dose.medicine) {
      speakMedicationInstruction(
        dose.medicine.name,
        dose.dosage,
        dose.dosageUnit,
        dose.medicine.instructions
      );
    }
  };

  // Schedule timer scanner
  useEffect(() => {
    if (!isAuthenticated) return;

    checkDueReminders();
    const interval = setInterval(checkDueReminders, 25000); // Check every 25 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, voiceEnabled]);

  // Mark dose as taken directly from reminder
  const takeDose = async (doseId, notes = '') => {
    try {
      const res = await api.put(`/schedules/${doseId}/status`, {
        status: 'taken',
        notes
      });
      if (res.data.success) {
        playDoseTakenChime();
        setActiveAlertDose(null);
        await checkDueReminders();
        return res.data;
      }
    } catch (err) {
      console.error('Error marking dose as taken:', err);
      throw err;
    }
  };

  // Snooze dose
  const snoozeDose = async (doseId, minutes = 10) => {
    try {
      const res = await api.post(`/schedules/${doseId}/snooze`, { minutes });
      if (res.data.success) {
        setActiveAlertDose(null);
        await checkDueReminders();
        return res.data;
      }
    } catch (err) {
      console.error('Error snoozing dose:', err);
      throw err;
    }
  };

  const dismissAlert = () => {
    setActiveAlertDose(null);
  };

  const testReminder = (medicineName = 'Metformin 500mg') => {
    playReminderChime();
    if (voiceEnabled) {
      speakMedicationInstruction('Sample Medicine', '1', 'Tablet', 'After meals with water');
    }
  };

  return (
    <ReminderContext.Provider
      value={{
        notificationPermission,
        requestPermission,
        activeAlertDose,
        upcomingReminders,
        checkDueReminders,
        takeDose,
        snoozeDose,
        dismissAlert,
        testReminder,
        triggerAlertManual: triggerAlert
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminder = () => useContext(ReminderContext);
