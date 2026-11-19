import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReminder } from '../context/ReminderContext';
import api from '../services/api';
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Volume2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sun,
  Sunset,
  Moon,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { speakMedicationInstruction } from '../utils/soundEffects';

export default function DashboardPage() {
  const { user, activePatient } = useAuth();
  const { takeDose } = useReminder();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const activeUser = activePatient || user;

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [analyticsRes, scheduleRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/schedules/today')
      ]);

      if (analyticsRes.data.success) {
        setDashboardData(analyticsRes.data);
      }
      if (scheduleRes.data.success) {
        setTodaySchedule(scheduleRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activePatient]);

  const handleTakeDose = async (doseId) => {
    try {
      setActionLoadingId(doseId);
      await takeDose(doseId);
      await fetchDashboard();
    } catch (err) {
      alert('Failed to mark dose as taken.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-slate-600 font-semibold text-lg">Loading your health overview...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const todayStats = stats.today || {};
  const weeklyTrend = dashboardData?.weeklyTrend || [];
  const lowStock = dashboardData?.lowStockMedicines || [];

  const allDoses = todaySchedule?.allDoses || [];
  const nextPendingDose = allDoses.find((d) => d.status === 'pending');

  const filteredDoses =
    selectedSlot === 'all'
      ? allDoses
      : allDoses.filter((d) => d.timeSlot === selectedSlot);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-primary-600 to-indigo-700 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Daily Health Companion</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Good day, {activeUser?.name || 'Friend'}!
          </h2>
          <p className="mt-2 text-sky-100 text-base sm:text-lg font-medium leading-relaxed">
            {todayStats.pending === 0 && todayStats.total > 0
              ? '🎉 Excellent work! All scheduled medicines for today have been taken.'
              : `You have ${todayStats.pending || 0} medication ${
                  todayStats.pending === 1 ? 'dose' : 'doses'
                } remaining today.`}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-sky-200">
            <div className="flex items-center space-x-1.5 bg-black/15 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-sky-300" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-black/15 px-3 py-1.5 rounded-xl">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>{stats.streak || 0} Day Adherence Streak!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner (if applicable) */}
      {lowStock.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base">Medication Refill Alert</h4>
              <p className="text-sm text-amber-800">
                {lowStock.map((m) => `${m.name} (${m.stockQuantity} left)`).join(', ')} - Please contact pharmacy or caregiver for refill.
              </p>
            </div>
          </div>
          <Link
            to="/medicines"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            Review Stocks
          </Link>
        </div>
      )}

      {/* 4 Interactive Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Active Medicines */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Medicines
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-primary-600 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {stats.activeMedicines || 0}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {stats.totalMedicines || 0} Total in profile
          </p>
        </div>

        {/* Doses Taken Today */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Doses Taken
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-700">
            {todayStats.taken || 0}
            <span className="text-base text-slate-400 font-semibold"> / {todayStats.total || 0}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-600">
            Completed on schedule
          </p>
        </div>

        {/* Pending & Missed Doses */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Pending / Missed
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {todayStats.pending || 0}
            <span className="text-sm font-semibold text-rose-600 ml-1">
              {todayStats.missed > 0 ? `(${todayStats.missed} missed)` : ''}
            </span>
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {todayStats.pending > 0 ? 'Awaiting your intake' : 'No pending doses'}
          </p>
        </div>

        {/* Adherence Rate */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
              Adherence Rate
            </span>
            <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-primary-700">
            {todayStats.adherence}%
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Weekly Avg: {stats.weeklyAvgAdherence || 100}%
          </p>
        </div>
      </div>

      {/* Next Upcoming Reminder Hero Box (if pending dose exists) */}
      {nextPendingDose && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-2 border-emerald-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Next Upcoming Dose • {nextPendingDose.scheduledTime}
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {nextPendingDose.medicine?.name}
              </h3>
              <p className="text-sm text-slate-600 font-semibold">
                Dosage: {nextPendingDose.dosage} {nextPendingDose.dosageUnit} •{' '}
                <span className="text-primary-700 font-bold">
                  {nextPendingDose.medicine?.instructions || 'Take with water'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              onClick={() =>
                speakMedicationInstruction(
                  nextPendingDose.medicine?.name || 'Medicine',
                  nextPendingDose.dosage,
                  nextPendingDose.dosageUnit,
                  nextPendingDose.medicine?.instructions || 'Take now'
                )
              }
              className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
              title="Read instruction aloud"
            >
              <Volume2 className="w-5 h-5 text-primary-600" />
            </button>
            <button
              onClick={() => handleTakeDose(nextPendingDose._id)}
              disabled={actionLoadingId === nextPendingDose._id}
              className="flex-1 md:flex-initial py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {actionLoadingId === nextPendingDose._id ? 'Saving...' : 'Mark as Taken Now'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Today's Schedule & 7-Day Adherence Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Today's Schedule</h3>
              <p className="text-xs font-semibold text-slate-500">
                {allDoses.length} scheduled doses today
              </p>
            </div>

            {/* Time Slot Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600 overflow-x-auto">
              <button
                onClick={() => setSelectedSlot('all')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedSlot === 'all'
                    ? 'bg-white shadow-xs text-primary-700 font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                All Doses
              </button>
              <button
                onClick={() => setSelectedSlot('morning')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedSlot === 'morning'
                    ? 'bg-white shadow-xs text-amber-700 font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                🌅 Morning
              </button>
              <button
                onClick={() => setSelectedSlot('afternoon')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedSlot === 'afternoon'
                    ? 'bg-white shadow-xs text-sky-700 font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                ☀️ Afternoon
              </button>
              <button
                onClick={() => setSelectedSlot('evening')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedSlot === 'evening'
                    ? 'bg-white shadow-xs text-purple-700 font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                🌇 Evening
              </button>
              <button
                onClick={() => setSelectedSlot('night')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedSlot === 'night'
                    ? 'bg-white shadow-xs text-indigo-700 font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                🌙 Night
              </button>
            </div>
          </div>

          {/* Doses List */}
          <div className="mt-5 space-y-3">
            {filteredDoses.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Pill className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-base">No doses for this slot</p>
                <p className="text-xs">Enjoy your rest!</p>
              </div>
            ) : (
              filteredDoses.map((dose) => {
                const med = dose.medicine || {};
                const isTaken = dose.status === 'taken';
                const isMissed = dose.status === 'missed';
                const isSkipped = dose.status === 'skipped';

                return (
                  <div
                    key={dose._id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isTaken
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : isMissed
                        ? 'bg-rose-50/60 border-rose-200'
                        : isSkipped
                        ? 'bg-slate-100 border-slate-200 opacity-70'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Pill Badge */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs font-black ${
                          isTaken
                            ? 'bg-emerald-600 text-white'
                            : isMissed
                            ? 'bg-rose-500 text-white'
                            : isSkipped
                            ? 'bg-slate-400 text-white'
                            : 'bg-sky-100 text-primary-700'
                        }`}
                      >
                        {isTaken ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : isMissed ? (
                          <XCircle className="w-6 h-6" />
                        ) : (
                          <Pill className="w-6 h-6" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-extrabold text-slate-900">
                            {med.name || 'Medicine'}
                          </h4>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                            {dose.scheduledTime}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                          {dose.dosage} {dose.dosageUnit} •{' '}
                          <span className="text-primary-800 font-bold">
                            {med.instructions || 'After food'}
                          </span>
                        </p>

                        {dose.notes && (
                          <p className="text-xs text-slate-500 italic mt-0.5">
                            Note: {dose.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() =>
                          speakMedicationInstruction(
                            med.name || 'Medicine',
                            dose.dosage,
                            dose.dosageUnit,
                            med.instructions || 'Take now'
                          )
                        }
                        className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-slate-100 transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      {isTaken ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Taken</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTakeDose(dose._id)}
                          disabled={actionLoadingId === dose._id}
                          className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{actionLoadingId === dose._id ? 'Saving...' : 'Mark Taken'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/schedule"
              className="text-sm font-bold text-primary-600 hover:text-primary-700 inline-flex items-center space-x-1"
            >
              <span>Manage & View Full Calendar Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Weekly Adherence & Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Weekly Adherence Chart Box */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">7-Day Adherence</h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                Avg: {stats.weeklyAvgAdherence || 0}%
              </span>
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="pt-2">
              <div className="flex items-end justify-between h-40 gap-2 border-b border-slate-100 pb-2">
                {weeklyTrend.map((day) => {
                  const barHeight = Math.max(day.adherence, 8);
                  const isFull = day.adherence >= 80;

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap shadow-md z-20">
                        {day.dayName}: {day.taken}/{day.total} taken ({day.adherence}%)
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                          isFull
                            ? 'bg-emerald-500 group-hover:bg-emerald-600'
                            : day.adherence > 0
                            ? 'bg-amber-400 group-hover:bg-amber-500'
                            : 'bg-slate-200 group-hover:bg-slate-300'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Day Labels */}
              <div className="flex justify-between mt-2 text-[11px] font-bold text-slate-400">
                {weeklyTrend.map((day) => (
                  <span key={day.date} className="flex-1 text-center truncate">
                    {day.dayName}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-center">
              <Link
                to="/analytics"
                className="text-xs font-bold text-primary-600 hover:text-primary-700"
              >
                View Detailed Analytics &rarr;
              </Link>
            </div>
          </div>

          {/* Quick Care Actions */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl">
            <h4 className="text-lg font-extrabold text-white">Need Assistance?</h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Family members and caregivers can view real-time adherence and assist with doses.
            </p>

            <div className="mt-4 space-y-2">
              <Link
                to="/medicines"
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs text-white flex items-center justify-between transition-colors"
              >
                <span>Add / Manage Medicines</span>
                <Pill className="w-4 h-4 text-sky-400" />
              </Link>
              <Link
                to="/caregivers"
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs text-white flex items-center justify-between transition-colors"
              >
                <span>Manage Caregivers & Invite</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
