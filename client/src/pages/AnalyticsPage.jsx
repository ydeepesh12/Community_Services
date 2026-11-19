import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pill,
  Award,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export default function AnalyticsPage() {
  const { activePatient } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState(null);
  const [activeView, setActiveView] = useState('weekly'); // 'weekly' or 'monthly'

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [dashRes, weekRes, monthRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/weekly'),
        api.get('/analytics/monthly')
      ]);

      if (dashRes.data.success) setDashboardAnalytics(dashRes.data);
      if (weekRes.data.success) setWeeklyAnalytics(weekRes.data.data);
      if (monthRes.data.success) setMonthlyAnalytics(monthRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activePatient]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-slate-600 font-semibold text-lg">Calculating adherence statistics...</p>
      </div>
    );
  }

  const stats = dashboardAnalytics?.stats || {};
  const todayStats = stats.today || {};
  const medicineStats = dashboardAnalytics?.medicineStats || [];

  // Monthly stats
  const totalTakenMonth = monthlyAnalytics?.totalTaken || 0;
  const totalMissedMonth = monthlyAnalytics?.totalMissed || 0;
  const totalSkippedMonth = monthlyAnalytics?.totalSkipped || 0;
  const totalDosesMonth = totalTakenMonth + totalMissedMonth + totalSkippedMonth;
  const monthlyAdherence = monthlyAnalytics?.monthlyAdherence || 0;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Medication Adherence & Compliance Analytics
        </h2>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          Real-time compliance metrics, adherence percentages, and longitudinal trends calculated from MongoDB.
        </p>
      </div>

      {/* Top 3 Adherence KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today Adherence */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Adherence
            </span>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-900">
              {todayStats.adherence}%
            </span>
            <span className="text-xs font-bold text-slate-500">
              ({todayStats.taken} of {todayStats.total} taken)
            </span>
          </div>

          <div className="mt-4 w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              style={{ width: `${todayStats.adherence}%` }}
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* 7-Day Weekly Adherence */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
              7-Day Weekly Average
            </span>
            <span className="text-xs font-extrabold text-primary-700 bg-primary-100 px-2.5 py-0.5 rounded-full">
              Weekly
            </span>
          </div>

          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl sm:text-5xl font-black text-primary-700">
              {stats.weeklyAvgAdherence}%
            </span>
            <span className="text-xs font-bold text-slate-500">target: 80%+</span>
          </div>

          <div className="mt-4 w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              style={{ width: `${stats.weeklyAvgAdherence}%` }}
              className="bg-primary-600 h-full rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* 30-Day Monthly Adherence */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              30-Day Monthly Adherence
            </span>
            <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
              Monthly
            </span>
          </div>

          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl sm:text-5xl font-black text-purple-700">
              {monthlyAdherence}%
            </span>
            <span className="text-xs font-bold text-slate-500">
              ({totalTakenMonth} taken total)
            </span>
          </div>

          <div className="mt-4 w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              style={{ width: `${monthlyAdherence}%` }}
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Main Charts Row: Trend Chart & Taken vs Missed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Adherence Trend</h3>
              <p className="text-xs font-semibold text-slate-500">
                Daily completion rates (excluding future pending doses)
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
              <button
                onClick={() => setActiveView('weekly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeView === 'weekly' ? 'bg-white shadow-xs text-primary-700' : ''
                }`}
              >
                7-Day View
              </button>
              <button
                onClick={() => setActiveView('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeView === 'monthly' ? 'bg-white shadow-xs text-primary-700' : ''
                }`}
              >
                30-Day View
              </button>
            </div>
          </div>

          {/* SVG Trend Visualization */}
          <div className="mt-6">
            {activeView === 'weekly' ? (
              <div>
                <div className="flex items-end justify-between h-56 gap-3 pb-3 border-b border-slate-100">
                  {weeklyAnalytics.map((day) => {
                    const height = Math.max(day.adherence, 10);
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                        <div className="text-[11px] font-extrabold text-slate-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.adherence}%
                        </div>

                        <div
                          style={{ height: `${height}%` }}
                          className={`w-full max-w-[42px] rounded-t-xl transition-all duration-500 shadow-xs ${
                            day.adherence >= 80
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                              : day.adherence > 0
                              ? 'bg-gradient-to-t from-amber-500 to-amber-300'
                              : 'bg-slate-200'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-3 text-xs font-bold text-slate-500">
                  {weeklyAnalytics.map((day) => (
                    <div key={day.date} className="flex-1 text-center truncate">
                      <p className="font-extrabold text-slate-700">{day.dayOfWeek.substring(0, 3)}</p>
                      <p className="text-[10px] text-slate-400">{day.date.substring(5)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-end justify-between h-56 gap-1 pb-3 border-b border-slate-100 overflow-x-auto">
                  {(monthlyAnalytics?.trend || []).map((day) => {
                    const height = Math.max(day.adherence, 8);
                    return (
                      <div key={day.date} className="flex-1 min-w-[14px] flex flex-col items-center group relative">
                        <div
                          style={{ height: `${height}%` }}
                          className={`w-full rounded-t-md transition-all ${
                            day.adherence >= 80 ? 'bg-purple-500' : day.adherence > 0 ? 'bg-amber-400' : 'bg-slate-200'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                  <span>30 Days Ago</span>
                  <span>15 Days Ago</span>
                  <span>Today</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Taken vs Missed Doses Distribution (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Dose Distribution</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Cumulative outcomes over past 30 days
            </p>

            <div className="mt-6 space-y-4">
              {/* Taken */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-800">Taken</span>
                    <p className="text-xl font-black text-slate-900">{totalTakenMonth} Doses</p>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-emerald-700">
                  {totalDosesMonth > 0 ? Math.round((totalTakenMonth / totalDosesMonth) * 100) : 0}%
                </span>
              </div>

              {/* Missed */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-rose-800">Missed</span>
                    <p className="text-xl font-black text-slate-900">{totalMissedMonth} Doses</p>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-rose-700">
                  {totalDosesMonth > 0 ? Math.round((totalMissedMonth / totalDosesMonth) * 100) : 0}%
                </span>
              </div>

              {/* Skipped */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-400 text-white flex items-center justify-center font-bold">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-700">Skipped (Physician/Fast)</span>
                    <p className="text-xl font-black text-slate-900">{totalSkippedMonth} Doses</p>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-slate-600">
                  {totalDosesMonth > 0 ? Math.round((totalSkippedMonth / totalDosesMonth) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-800 font-medium">
            💡 High adherence (above 80%) significantly reduces risk of medical complications and hospital visits.
          </div>
        </div>
      </div>

      {/* Medicine-wise Adherence Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-1">
          Medicine-by-Medicine Compliance (Past 30 Days)
        </h3>
        <p className="text-xs font-semibold text-slate-500 mb-5">
          Adherence rates broken down by individual prescribed medication.
        </p>

        {medicineStats.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            No medicine dose logs recorded in the last 30 days yet.
          </p>
        ) : (
          <div className="space-y-4">
            {medicineStats.map((med) => (
              <div
                key={med.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-primary-600 font-bold">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{med.name}</h4>
                    <p className="text-xs text-slate-500">{med.dosage}</p>
                  </div>
                </div>

                {/* Progress Bar & Rate */}
                <div className="flex-1 max-w-md mx-0 md:mx-6">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>
                      {med.taken} of {med.total} taken
                    </span>
                    <span className="font-extrabold text-slate-900">{med.adherence}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${med.adherence}%` }}
                      className={`h-full rounded-full ${
                        med.adherence >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      med.adherence >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {med.adherence >= 80 ? 'Excellent' : 'Needs Attention'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
