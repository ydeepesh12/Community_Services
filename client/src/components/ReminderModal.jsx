import React, { useState } from 'react';
import { useReminder } from '../context/ReminderContext';
import { Bell, CheckCircle2, Clock, Volume2, X, Pill, AlertTriangle } from 'lucide-react';
import { speakMedicationInstruction } from '../utils/soundEffects';

export default function ReminderModal() {
  const { activeAlertDose, takeDose, snoozeDose, dismissAlert } = useReminder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);

  if (!activeAlertDose) return null;

  const med = activeAlertDose.medicine || {};

  const handleTake = async () => {
    setIsSubmitting(true);
    try {
      await takeDose(activeAlertDose._id);
    } catch (err) {
      alert('Failed to update dose status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnooze = async () => {
    setIsSubmitting(true);
    try {
      await snoozeDose(activeAlertDose._id, snoozeMinutes);
    } catch (err) {
      alert('Failed to snooze reminder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoice = () => {
    speakMedicationInstruction(
      med.name || 'Medicine',
      activeAlertDose.dosage,
      activeAlertDose.dosageUnit,
      med.instructions || 'Take now'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-primary-200 max-w-lg w-full overflow-hidden p-6 md:p-8 animate-scaleUp">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner animate-bounce">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                Medication Due Now
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">
                Time for your medicine
              </h2>
            </div>
          </div>
          <button
            onClick={dismissAlert}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Dismiss reminder"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Medicine Details Card */}
        <div className="my-6 p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white rounded-xl shadow-sm text-primary-600">
                <Pill className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  {med.name || 'Prescribed Medicine'}
                </h3>
                {med.genericName && (
                  <p className="text-sm text-slate-500 font-medium">({med.genericName})</p>
                )}
              </div>
            </div>
            <button
              onClick={handleVoice}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white rounded-xl shadow-sm text-primary-700 hover:bg-primary-50 text-sm font-semibold border border-primary-100 transition-all"
              title="Read aloud"
            >
              <Volume2 className="w-4 h-4" />
              <span>Listen</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-sky-100/80">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Dosage
              </span>
              <p className="text-lg font-bold text-slate-800">
                {activeAlertDose.dosage} {activeAlertDose.dosageUnit}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Instructions
              </span>
              <p className="text-base font-semibold text-primary-800">
                {med.instructions || 'Take as instructed'}
              </p>
            </div>
          </div>

          {med.notes && (
            <div className="mt-3 text-xs md:text-sm text-slate-600 bg-white/70 p-2.5 rounded-lg border border-sky-100">
              <span className="font-semibold text-slate-700">Note: </span>
              {med.notes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleTake}
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-lg md:text-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-0.5"
          >
            <CheckCircle2 className="w-7 h-7" />
            <span>{isSubmitting ? 'Recording...' : 'Mark as Taken Now'}</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSnooze}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-base flex items-center justify-center space-x-2 transition-colors"
            >
              <Clock className="w-5 h-5 text-slate-500" />
              <span>Snooze {snoozeMinutes}m</span>
            </button>

            <select
              value={snoozeMinutes}
              onChange={(e) => setSnoozeMinutes(Number(e.target.value))}
              className="py-3 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
