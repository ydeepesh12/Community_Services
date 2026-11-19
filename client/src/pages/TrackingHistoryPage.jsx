import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  History,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Printer,
  ChevronDown,
  Pill,
  Download
} from 'lucide-react';

export default function TrackingHistoryPage() {
  const { activePatient, user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [medicineFilter, setMedicineFilter] = useState('all');
  const [rangePreset, setRangePreset] = useState('7'); // '7', '30', '90', 'all'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const params = { limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (medicineFilter !== 'all') params.medicineId = medicineFilter;

      if (rangePreset !== 'custom') {
        const days = parseInt(rangePreset, 10);
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        params.startDate = start.toISOString().substring(0, 10);
        params.endDate = end.toISOString().substring(0, 10);
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const [logsRes, medsRes] = await Promise.all([
        api.get('/logs', { params }),
        api.get('/medicines')
      ]);

      if (logsRes.data.success) {
        setLogs(logsRes.data.data);
      }
      if (medsRes.data.success) {
        setMedicines(medsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, medicineFilter, rangePreset, startDate, endDate, activePatient]);

  const handlePrint = () => {
    window.print();
  };

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    const medName = log.medicine?.name?.toLowerCase() || '';
    const notes = log.notes?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    return medName.includes(searchLower) || notes.includes(searchLower);
  });

  // Calculate statistics for the current query view
  const totalCount = filteredLogs.length;
  const takenCount = filteredLogs.filter((l) => l.status === 'taken').length;
  const missedCount = filteredLogs.filter((l) => l.status === 'missed').length;
  const skippedCount = filteredLogs.filter((l) => l.status === 'skipped').length;
  const adherenceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Page Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Medication History & Dose Logs
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Complete persistent audit records of all scheduled, taken, missed, and skipped doses.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="py-2.5 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs flex items-center space-x-2 transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-primary-600" />
          <span>Print Doctor Report</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-xs font-bold uppercase text-slate-500">Total Logged</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-soft">
          <span className="text-xs font-bold uppercase text-emerald-700">Taken Successfully</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{takenCount}</p>
        </div>
        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 shadow-soft">
          <span className="text-xs font-bold uppercase text-rose-700">Missed Doses</span>
          <p className="text-2xl font-black text-rose-800 mt-1">{missedCount}</p>
        </div>
        <div className="p-4 bg-primary-50 rounded-2xl border border-primary-200 shadow-soft">
          <span className="text-xs font-bold uppercase text-primary-700">Period Adherence</span>
          <p className="text-2xl font-black text-primary-800 mt-1">{adherenceRate}%</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medicine or note..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Range Presets */}
          <div>
            <select
              value={rangePreset}
              onChange={(e) => setRangePreset(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-primary-500"
            >
              <option value="7">Past 7 Days</option>
              <option value="14">Past 14 Days</option>
              <option value="30">Past 30 Days (Monthly)</option>
              <option value="90">Past 90 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Filter by Medicine */}
          <div>
            <select
              value={medicineFilter}
              onChange={(e) => setMedicineFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Medicines</option>
              {medicines.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="taken">Taken</option>
              <option value="missed">Missed</option>
              <option value="skipped">Skipped</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Custom date range inputs */}
        {rangePreset === 'custom' && (
          <div className="flex items-center space-x-3 pt-2">
            <span className="text-xs font-bold text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
            <span className="text-xs font-bold text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>
        )}
      </div>

      {/* History Table / Records */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-soft">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-800">No history records found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your filter date range or status to see previous doses.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Medicine & Dosage</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Completed Timestamp</th>
                  <th className="py-4 px-6">Logged Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.map((log) => {
                  const med = log.medicine || {};
                  const isTaken = log.status === 'taken';
                  const isMissed = log.status === 'missed';
                  const isSkipped = log.status === 'skipped';

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date & Time */}
                      <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{log.scheduledDate}</span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                            {log.scheduledTime}
                          </span>
                        </div>
                      </td>

                      {/* Medicine */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{med.name || 'Medicine'}</p>
                            <p className="text-xs text-slate-500">
                              {log.dosage} {log.dosageUnit} • {med.instructions || 'With water'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                            isTaken
                              ? 'bg-emerald-100 text-emerald-800'
                              : isMissed
                              ? 'bg-rose-100 text-rose-800'
                              : isSkipped
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isTaken ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : isMissed ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>

                      {/* Completed At */}
                      <td className="py-4 px-6 text-xs text-slate-600 whitespace-nowrap font-medium">
                        {log.takenAt ? (
                          <div>
                            <p className="font-bold text-slate-800">
                              {new Date(log.takenAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {new Date(log.takenAt).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                        {log.notes ? (
                          <span className="italic">"{log.notes}"</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
