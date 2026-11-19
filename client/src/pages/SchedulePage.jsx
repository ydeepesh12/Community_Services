import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReminder } from '../context/ReminderContext';
import api from '../services/api';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pill,
  Volume2,
  Edit3,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Check
} from 'lucide-react';
import { speakMedicationInstruction, playDoseTakenChime } from '../utils/soundEffects';

export default function SchedulePage() {
  const { activePatient } = useAuth();
  const { checkDueReminders } = useReminder();

  const [currentDateStr, setCurrentDateStr] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Note editing state
  const [editingNoteDose, setEditingNoteDose] = useState(null);
  const [noteText, setNoteText] = useState('');

  const fetchSchedule = async (dateStr) => {
    try {
      setLoading(true);
      const res = await api.get(`/schedules?date=${dateStr}`);
      if (res.data.success) {
        setScheduleData(res.data);
      }
    } catch (err) {
      console.error('Failed to load schedule for date:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(currentDateStr);
  }, [currentDateStr, activePatient]);

  // Date Navigation Helpers
  const changeDateByDays = (days) => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    setCurrentDateStr(`${newYear}-${newMonth}-${newDay}`);
  };

  const jumpToToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setCurrentDateStr(`${y}-${m}-${d}`);
  };

  const isToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return currentDateStr === `${y}-${m}-${d}`;
  };

  // Update dose status
  const handleUpdateStatus = async (doseId, newStatus) => {
    try {
      setActionLoadingId(doseId);
      const res = await api.put(`/schedules/${doseId}/status`, { status: newStatus });
      if (res.data.success) {
        if (newStatus === 'taken') {
          playDoseTakenChime();
        }
        await fetchSchedule(currentDateStr);
        await checkDueReminders();
      }
    } catch (err) {
      alert('Failed to update dose: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save note on dose
  const handleSaveNote = async () => {
    if (!editingNoteDose) return;
    try {
      await api.put(`/schedules/${editingNoteDose._id}/status`, {
        status: editingNoteDose.status,
        notes: noteText
      });
      setEditingNoteDose(null);
      setNoteText('');
      await fetchSchedule(currentDateStr);
    } catch (err) {
      alert('Failed to save note.');
    }
  };

  const stats = scheduleData?.stats || {};
  const allDoses = scheduleData?.allDoses || [];
  const slots = scheduleData?.slots || { morning: [], afternoon: [], evening: [], night: [] };

  const getDosesToDisplay = () => {
    if (activeTab === 'all') return allDoses;
    return slots[activeTab] || [];
  };

  const displayedDoses = getDosesToDisplay();

  const formattedDateHeader = new Date(currentDateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Date Navigation Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeDateByDays(-1)}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {formattedDateHeader}
            </h2>
            <div className="flex items-center justify-center space-x-2 mt-0.5">
              {isToday() && (
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
              <span className="text-xs font-semibold text-slate-500">
                {stats.taken || 0} of {stats.total || 0} Doses Completed ({stats.adherencePercentage || 0}%)
              </span>
            </div>
          </div>

          <button
            onClick={() => changeDateByDays(1)}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="flex items-center space-x-2">
          {!isToday() && (
            <button
              onClick={jumpToToday}
              className="py-2 px-3.5 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 font-bold text-xs transition-colors"
            >
              Jump to Today
            </button>
          )}

          <div className="relative">
            <input
              type="date"
              value={currentDateStr}
              onChange={(e) => e.target.value && setCurrentDateStr(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs: All, Morning, Afternoon, Evening, Night */}
      <div className="flex items-center bg-slate-200/80 p-1.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-xl transition-all whitespace-nowrap text-center ${
            activeTab === 'all'
              ? 'bg-white shadow-xs text-slate-900 font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          All Doses ({allDoses.length})
        </button>

        <button
          onClick={() => setActiveTab('morning')}
          className={`flex-1 py-2 px-4 rounded-xl transition-all whitespace-nowrap text-center flex items-center justify-center space-x-1.5 ${
            activeTab === 'morning'
              ? 'bg-white shadow-xs text-amber-700 font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Morning ({slots.morning.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('afternoon')}
          className={`flex-1 py-2 px-4 rounded-xl transition-all whitespace-nowrap text-center flex items-center justify-center space-x-1.5 ${
            activeTab === 'afternoon'
              ? 'bg-white shadow-xs text-sky-700 font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Sun className="w-4 h-4 text-sky-500" />
          <span>Afternoon ({slots.afternoon.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('evening')}
          className={`flex-1 py-2 px-4 rounded-xl transition-all whitespace-nowrap text-center flex items-center justify-center space-x-1.5 ${
            activeTab === 'evening'
              ? 'bg-white shadow-xs text-purple-700 font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Sunset className="w-4 h-4 text-purple-500" />
          <span>Evening ({slots.evening.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('night')}
          className={`flex-1 py-2 px-4 rounded-xl transition-all whitespace-nowrap text-center flex items-center justify-center space-x-1.5 ${
            activeTab === 'night'
              ? 'bg-white shadow-xs text-indigo-700 font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Moon className="w-4 h-4 text-indigo-500" />
          <span>Night ({slots.night.length})</span>
        </button>
      </div>

      {/* Doses Display Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : displayedDoses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-soft">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-800">No medication doses scheduled</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            There are no active medicines scheduled for this time slot or date.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedDoses.map((dose) => {
            const med = dose.medicine || {};
            const isTaken = dose.status === 'taken';
            const isMissed = dose.status === 'missed';
            const isSkipped = dose.status === 'skipped';
            const isPending = dose.status === 'pending';

            return (
              <div
                key={dose._id}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-soft ${
                  isTaken
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : isMissed
                    ? 'bg-rose-50/60 border-rose-300'
                    : isSkipped
                    ? 'bg-slate-100 border-slate-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Medicine info & timing */}
                <div className="flex items-start sm:items-center space-x-4">
                  {/* Status Indicator Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-xs shrink-0 ${
                      isTaken
                        ? 'bg-emerald-600 text-white'
                        : isMissed
                        ? 'bg-rose-500 text-white'
                        : isSkipped
                        ? 'bg-slate-400 text-white'
                        : 'bg-primary-100 text-primary-700'
                    }`}
                  >
                    {isTaken ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : isMissed ? (
                      <XCircle className="w-7 h-7" />
                    ) : isSkipped ? (
                      <AlertCircle className="w-7 h-7" />
                    ) : (
                      <Clock className="w-7 h-7" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                        {med.name || 'Medicine'}
                      </h3>

                      <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-xs">
                        {dose.scheduledTime}
                      </span>

                      <span
                        className={`px-3 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                          isTaken
                            ? 'bg-emerald-200 text-emerald-900'
                            : isMissed
                            ? 'bg-rose-200 text-rose-900'
                            : isSkipped
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {dose.status}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-600">
                      <span>
                        Dosage: <strong>{dose.dosage} {dose.dosageUnit}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-primary-800 font-bold">
                        {med.instructions || 'After meals'}
                      </span>
                      {dose.takenAt && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold text-xs">
                            Taken at: {new Date(dose.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>

                    {dose.notes && (
                      <div className="mt-2 text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-200 inline-block">
                        <span className="font-bold text-slate-700">Note: </span>
                        {dose.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Elderly-Friendly Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                  {/* Voice Button */}
                  <button
                    onClick={() =>
                      speakMedicationInstruction(
                        med.name || 'Medicine',
                        dose.dosage,
                        dose.dosageUnit,
                        med.instructions || 'Take now'
                      )
                    }
                    className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 shadow-xs transition-colors"
                    title="Read instructions aloud"
                  >
                    <Volume2 className="w-5 h-5 text-primary-600" />
                  </button>

                  {/* Add / Edit Note */}
                  <button
                    onClick={() => {
                      setEditingNoteDose(dose);
                      setNoteText(dose.notes || '');
                    }}
                    className="p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl border border-slate-200 shadow-xs transition-colors"
                    title="Add note about dose"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>

                  {/* Mark as Taken Button */}
                  {isTaken ? (
                    <button
                      onClick={() => handleUpdateStatus(dose._id, 'pending')}
                      disabled={actionLoadingId === dose._id}
                      className="py-3 px-5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm transition-colors"
                      title="Undo dose taken status"
                    >
                      Undo (Mark Pending)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(dose._id, 'taken')}
                      disabled={actionLoadingId === dose._id}
                      className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{actionLoadingId === dose._id ? 'Saving...' : 'Mark as Taken'}</span>
                    </button>
                  )}

                  {/* Mark as Skipped Button */}
                  {!isTaken && !isSkipped && (
                    <button
                      onClick={() => handleUpdateStatus(dose._id, 'skipped')}
                      disabled={actionLoadingId === dose._id}
                      className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                    >
                      Skip
                    </button>
                  )}

                  {/* Mark as Missed Button */}
                  {!isTaken && !isMissed && (
                    <button
                      onClick={() => handleUpdateStatus(dose._id, 'missed')}
                      disabled={actionLoadingId === dose._id}
                      className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-colors"
                    >
                      Missed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNoteDose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scaleUp">
            <h3 className="text-xl font-bold text-slate-900">
              Add Note for {editingNoteDose.medicine?.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add details such as side effects, diet taken with, or caregiver remarks.
            </p>

            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g., Felt slight nausea, took with half cup of milk"
              className="mt-4 w-full p-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditingNoteDose(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-xs"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
