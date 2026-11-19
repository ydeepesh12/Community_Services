const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const DoseLog = require('../models/DoseLog');
const CaregiverRelationship = require('../models/CaregiverRelationship');
const NotificationSettings = require('../models/NotificationSettings');
const { formatDate, getTimeSlot, createDateTime } = require('./doseScheduler');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine_reminder_db';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing collections
    await User.deleteMany({});
    await Medicine.deleteMany({});
    await DoseLog.deleteMany({});
    await CaregiverRelationship.deleteMany({});
    await NotificationSettings.deleteMany({});
    console.log('[Seed] Cleared old records...');

    // 1. Create Patient User (Eleanor Vance)
    const patient = await User.create({
      name: 'Eleanor Vance',
      email: 'patient@example.com',
      password: 'password123',
      role: 'patient',
      phone: '+1 (555) 234-5678',
      emergencyContact: {
        name: 'Mark Vance (Son)',
        phone: '+1 (555) 987-6543',
        relationship: 'Son'
      },
      preferences: {
        fontSize: 'large',
        highContrast: false,
        voiceAssistance: true,
        theme: 'light'
      }
    });

    // 2. Create Caregiver User (Mark Vance)
    const caregiver = await User.create({
      name: 'Mark Vance',
      email: 'caregiver@example.com',
      password: 'password123',
      role: 'caregiver',
      phone: '+1 (555) 987-6543',
      emergencyContact: {
        name: 'Eleanor Vance',
        phone: '+1 (555) 234-5678',
        relationship: 'Mother'
      },
      preferences: {
        fontSize: 'normal',
        highContrast: false,
        voiceAssistance: false,
        theme: 'light'
      }
    });

    // 3. Link them with CaregiverRelationship
    await CaregiverRelationship.create({
      patient: patient._id,
      caregiver: caregiver._id,
      status: 'accepted',
      inviteCode: 'CARE-77192',
      relationship: 'Son / Primary Caregiver',
      permissions: {
        canView: true,
        canLogDose: true,
        canEditMedicines: true
      }
    });

    // 4. Notification Settings
    await NotificationSettings.create({
      user: patient._id,
      browserNotificationsEnabled: true,
      soundEnabled: true,
      advanceReminderMinutes: 5,
      snoozeDurationMinutes: 10,
      missedDoseAlertCaregiver: true
    });

    await NotificationSettings.create({
      user: caregiver._id,
      browserNotificationsEnabled: true,
      soundEnabled: true,
      advanceReminderMinutes: 0,
      snoozeDurationMinutes: 10,
      missedDoseAlertCaregiver: true
    });

    // 5. Create Realistic Elderly Medicines
    const medicinesData = [
      {
        user: patient._id,
        name: 'Metformin',
        genericName: 'Glucophage',
        dosage: '500',
        dosageUnit: 'mg',
        form: 'tablet',
        color: 'blue',
        instructions: 'After food',
        frequency: 'twice_daily',
        scheduleTimes: ['08:00', '19:30'],
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        prescribingDoctor: 'Dr. Sarah Jenkins (Endocrinologist)',
        stockQuantity: 42,
        refillAlertThreshold: 10,
        notes: 'For blood sugar control. Take right after morning and evening meals.'
      },
      {
        user: patient._id,
        name: 'Lisinopril',
        genericName: 'Prinivil',
        dosage: '10',
        dosageUnit: 'mg',
        form: 'tablet',
        color: 'emerald',
        instructions: 'Morning upon waking',
        frequency: 'once_daily',
        scheduleTimes: ['08:00'],
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        prescribingDoctor: 'Dr. Robert Chen (Cardiologist)',
        stockQuantity: 18,
        refillAlertThreshold: 7,
        notes: 'For blood pressure maintenance. Take with full glass of water.'
      },
      {
        user: patient._id,
        name: 'Calcium + Vitamin D3',
        genericName: 'Caltrate 600+D3',
        dosage: '1',
        dosageUnit: 'Tablet',
        form: 'tablet',
        color: 'amber',
        instructions: 'With food',
        frequency: 'once_daily',
        scheduleTimes: ['13:00'],
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        prescribingDoctor: 'Dr. Jenkins',
        stockQuantity: 5, // Triggers low-stock reminder!
        refillAlertThreshold: 7,
        notes: 'Bone strength supplement. Best absorbed during midday lunch.'
      },
      {
        user: patient._id,
        name: 'Atorvastatin',
        genericName: 'Lipitor',
        dosage: '20',
        dosageUnit: 'mg',
        form: 'tablet',
        color: 'purple',
        instructions: 'Before sleep',
        frequency: 'once_daily',
        scheduleTimes: ['21:00'],
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        prescribingDoctor: 'Dr. Robert Chen',
        stockQuantity: 28,
        refillAlertThreshold: 7,
        notes: 'Cholesterol medication. Always take before bed.'
      },
      {
        user: patient._id,
        name: 'Latanoprost Ophthalmic',
        genericName: 'Xalatan',
        dosage: '1',
        dosageUnit: 'drops',
        form: 'drops',
        color: 'teal',
        instructions: 'Before sleep',
        frequency: 'once_daily',
        scheduleTimes: ['21:30'],
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        prescribingDoctor: 'Dr. Wong (Ophthalmologist)',
        stockQuantity: 12,
        refillAlertThreshold: 3,
        notes: 'Glaucoma eye drops. Place 1 drop in each eye at bedtime.'
      }
    ];

    const medicines = await Medicine.insertMany(medicinesData);
    console.log(`[Seed] Created ${medicines.length} medicines for patient.`);

    // 6. Generate Past 7 Days Dose Logs (for realistic adherence analytics)
    const doseLogs = [];
    for (let dayOffset = 6; dayOffset >= 1; dayOffset--) {
      const d = new Date();
      d.setDate(d.getDate() - dayOffset);
      const dateStr = formatDate(d);

      for (const med of medicines) {
        for (const timeStr of med.scheduleTimes) {
          const scheduledDateTime = createDateTime(dateStr, timeStr);
          const timeSlot = getTimeSlot(timeStr);

          // Most days taken (88% adherence rate)
          const isTaken = Math.random() > 0.12;
          const status = isTaken ? 'taken' : (Math.random() > 0.5 ? 'missed' : 'skipped');

          doseLogs.push({
            user: patient._id,
            medicine: med._id,
            scheduledDate: dateStr,
            scheduledTime: timeStr,
            scheduledDateTime,
            timeSlot,
            dosage: med.dosage,
            dosageUnit: med.dosageUnit,
            status,
            takenAt: status === 'taken' ? new Date(scheduledDateTime.getTime() + 15 * 60000) : null,
            loggedBy: patient._id,
            notes: status === 'taken' ? 'Taken on schedule' : (status === 'skipped' ? 'Doctor advised pause for fasting' : 'Forgot to take on time')
          });
        }
      }
    }

    // Today's doses
    const todayStr = formatDate(new Date());
    const currentHour = new Date().getHours();

    for (const med of medicines) {
      for (const timeStr of med.scheduleTimes) {
        const scheduledDateTime = createDateTime(todayStr, timeStr);
        const timeSlot = getTimeSlot(timeStr);
        const [hour] = timeStr.split(':').map(Number);

        let status = 'pending';
        let takenAt = null;

        // If scheduled time was earlier today, mark as taken
        if (hour < currentHour) {
          status = 'taken';
          takenAt = scheduledDateTime;
        }

        doseLogs.push({
          user: patient._id,
          medicine: med._id,
          scheduledDate: todayStr,
          scheduledTime: timeStr,
          scheduledDateTime,
          timeSlot,
          dosage: med.dosage,
          dosageUnit: med.dosageUnit,
          status,
          takenAt,
          loggedBy: patient._id,
          notes: status === 'taken' ? 'Taken with breakfast' : ''
        });
      }
    }

    await DoseLog.insertMany(doseLogs);
    console.log(`[Seed] Created ${doseLogs.length} historical and today's dose logs.`);

    console.log('----------------------------------------------------');
    console.log('[Seed Complete] Test accounts:');
    console.log('Patient Login:   patient@example.com   / password123');
    console.log('Caregiver Login: caregiver@example.com / password123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedData();
