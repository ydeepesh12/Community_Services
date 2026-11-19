import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Pill,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  Check,
  X,
  Volume2,
  HeartPulse,
  UserCheck
} from 'lucide-react';
import { speakMedicationInstruction } from '../utils/soundEffects';

const COLOR_MAP = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' }
};

export default function MedicinesPage() {
  const { activePatient } = useAuth();

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deletingMedicine, setDeletingMedicine] = useState(null);
  const [pausingMedicine, setPausingMedicine] = useState(null);
  const [pauseReason, setPauseReason] = useState('');
  const [detailMedicine, setDetailMedicine] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    genericName: '',
    dosage: '1',
    dosageUnit: 'Tablet',
    form: 'tablet',
    color: 'blue',
    instructions: 'After food',
    frequency: 'once_daily',
    scheduleTimes: ['08:00'],
    stockQuantity: 30,
    refillAlertThreshold: 7,
    prescribingDoctor: '',
    notes: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medicines');
      if (res.data.success) {
        setMedicines(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [activePatient]);

  // Handle Frequency Change presets
  const handleFrequencyChange = (freq) => {
    let times = ['08:00'];
    if (freq === 'twice_daily') times = ['08:00', '20:00'];
    if (freq === 'three_times_daily') times = ['08:00', '13:00', '20:00'];
    if (freq === 'four_times_daily') times = ['08:00', '12:00', '16:00', '20:00'];

    setFormData((prev) => ({
      ...prev,
      frequency: freq,
      scheduleTimes: times
    }));
  };

  const handleAddTime = (timeStr) => {
    if (!timeStr) return;
    if (formData.scheduleTimes.includes(timeStr)) return;
    setFormData((prev) => ({
      ...prev,
      scheduleTimes: [...prev.scheduleTimes, timeStr].sort()
    }));
  };

  const handleRemoveTime = (index) => {
    if (formData.scheduleTimes.length <= 1) {
      alert('Medication must have at least one scheduled time.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      scheduleTimes: prev.scheduleTimes.filter((_, i) => i !== index)
    }));
  };

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name,
      genericName: med.genericName || '',
      dosage: med.dosage,
      dosageUnit: med.dosageUnit,
      form: med.form || 'tablet',
      color: med.color || 'blue',
      instructions: med.instructions || 'After food',
      frequency: med.frequency || 'once_daily',
      scheduleTimes: med.scheduleTimes || ['08:00'],
      stockQuantity: med.stockQuantity !== undefined ? med.stockQuantity : 30,
      refillAlertThreshold: med.refillAlertThreshold !== undefined ? med.refillAlertThreshold : 7,
      prescribingDoctor: med.prescribingDoctor || '',
      notes: med.notes || '',
      startDate: med.startDate ? new Date(med.startDate).toISOString().substring(0, 10) : '',
      endDate: med.endDate ? new Date(med.endDate).toISOString().substring(0, 10) : ''
    });
    setFormError('');
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter medicine name.');
      return;
    }
    if (!formData.dosage.trim()) {
      setFormError('Please enter dosage.');
      return;
    }
    if (formData.scheduleTimes.length === 0) {
      setFormError('Please select at least one schedule time.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingMedicine) {
        await api.put(`/medicines/${editingMedicine._id}`, formData);
      } else {
        await api.post('/medicines', formData);
      }
      setIsAddModalOpen(false);
      setEditingMedicine(null);
      await fetchMedicines();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save medicine.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMedicine) return;
    try {
      await api.delete(`/medicines/${deletingMedicine._id}`);
      setDeletingMedicine(null);
      await fetchMedicines();
    } catch (err) {
      alert('Failed to delete medicine: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTogglePause = async () => {
    if (!pausingMedicine) return;
    try {
      await api.patch(`/medicines/${pausingMedicine._id}/pause`, {
        isPaused: !pausingMedicine.isPaused,
        reason: pauseReason
      });
      setPausingMedicine(null);
      setPauseReason('');
      await fetchMedicines();
    } catch (err) {
      alert('Failed to pause/resume medicine.');
    }
  };

  // Filtered List
  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(search.toLowerCase()) ||
      (med.genericName && med.genericName.toLowerCase().includes(search.toLowerCase())) ||
      (med.prescribingDoctor && med.prescribingDoctor.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'active') return med.isActive && !med.isPaused;
    if (filterStatus === 'paused') return med.isPaused;
    if (filterStatus === 'low_stock') return med.stockQuantity <= med.refillAlertThreshold;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Medicine Cabinet
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Manage your prescriptions, dosages, intake instructions and schedules.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-3 px-5 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-base shadow-md shadow-primary-600/20 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine name, doctor, generic..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({medicines.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('paused')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === 'paused'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Paused
          </button>
          <button
            onClick={() => setFilterStatus('low_stock')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === 'low_stock'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Low Stock Alert
          </button>
        </div>
      </div>

      {/* Medicines Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-soft">
          <Pill className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-800">No medicines found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search
              ? 'No medicines match your search criteria. Try a different term.'
              : 'Your medicine cabinet is currently empty. Click the button below to add your first prescribed medication.'}
          </p>
          {!search && (
            <button
              onClick={handleOpenAdd}
              className="mt-5 py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-xs inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Medicine</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMedicines.map((med) => {
            const colorStyle = COLOR_MAP[med.color] || COLOR_MAP.blue;
            const isLowStock = med.stockQuantity <= med.refillAlertThreshold;

            return (
              <div
                key={med._id}
                className={`bg-white rounded-3xl border p-5 shadow-soft transition-all hover:shadow-md flex flex-col justify-between ${
                  med.isPaused
                    ? 'border-amber-200 bg-amber-50/20'
                    : isLowStock
                    ? 'border-rose-200'
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Top Bar with color badge & pause status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${colorStyle.bg} ${colorStyle.text} border ${colorStyle.border}`}
                      >
                        <Pill className="w-6 h-6 transform -rotate-45" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                          {med.name}
                        </h3>
                        {med.genericName && (
                          <p className="text-xs text-slate-500 font-medium">({med.genericName})</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        speakMedicationInstruction(
                          med.name,
                          med.dosage,
                          med.dosageUnit,
                          med.instructions
                        )
                      }
                      className="p-2 text-slate-400 hover:text-primary-600 rounded-xl hover:bg-slate-100 transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {med.isPaused ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center space-x-1">
                        <PauseCircle className="w-3 h-3" />
                        <span>Paused</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">
                      {med.form}
                    </span>

                    {isLowStock && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center space-x-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock ({med.stockQuantity} left)</span>
                      </span>
                    )}
                  </div>

                  {/* Dosage & Instructions */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Dosage:</span>
                      <span className="font-extrabold text-slate-900">
                        {med.dosage} {med.dosageUnit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Instructions:</span>
                      <span className="font-bold text-primary-700">{med.instructions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Times:</span>
                      <span className="font-bold text-slate-800">
                        {med.scheduleTimes.join(', ')}
                      </span>
                    </div>
                  </div>

                  {med.notes && (
                    <p className="mt-2.5 text-xs text-slate-500 italic line-clamp-2">
                      "{med.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setDetailMedicine(med)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {/* Pause / Resume Button */}
                    <button
                      onClick={() => setPausingMedicine(med)}
                      className={`p-2 rounded-xl transition-colors ${
                        med.isPaused
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-amber-600 hover:bg-amber-50'
                      }`}
                      title={med.isPaused ? 'Resume Medication' : 'Pause Medication'}
                    >
                      {med.isPaused ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : (
                        <PauseCircle className="w-4 h-4" />
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(med)}
                      className="p-2 text-slate-500 hover:text-primary-600 rounded-xl hover:bg-slate-100 transition-colors"
                      title="Edit Medication"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingMedicine(med)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Delete Medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Medicine Modal */}
      {(isAddModalOpen || editingMedicine) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingMedicine ? `Edit ${editingMedicine.name}` : 'Add Prescribed Medicine'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMedicine(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveMedicine} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Metformin, Lisinopril"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  />
                </div>

                {/* Generic Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Generic / Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g., Glucophage"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                {/* Dosage */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Dosage Quantity *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 1, 500, 10"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  />
                </div>

                {/* Dosage Unit */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Unit *
                  </label>
                  <select
                    value={formData.dosageUnit}
                    onChange={(e) => setFormData({ ...formData, dosageUnit: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="mg">mg</option>
                    <option value="ml">ml</option>
                    <option value="drops">drops</option>
                    <option value="puffs">puffs</option>
                    <option value="patch">patch</option>
                    <option value="units">units</option>
                  </select>
                </div>

                {/* Form */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Medicine Form
                  </label>
                  <select
                    value={formData.form}
                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="liquid">Liquid / Syrup</option>
                    <option value="drops">Eye / Ear Drops</option>
                    <option value="inhaler">Inhaler</option>
                    <option value="injection">Injection</option>
                    <option value="topical">Ointment / Topical</option>
                    <option value="patch">Patch</option>
                  </select>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Instructions *
                  </label>
                  <select
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  >
                    <option value="After food">After food</option>
                    <option value="Before food">Before food</option>
                    <option value="With food">With food</option>
                    <option value="On empty stomach">On empty stomach</option>
                    <option value="Before sleep">Before sleep</option>
                    <option value="Morning upon waking">Morning upon waking</option>
                    <option value="Take with plenty of water">Take with plenty of water</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>
              </div>

              {/* Pill Color Tag */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Visual Pill Color Tag
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.keys(COLOR_MAP).map((colorKey) => {
                    const c = COLOR_MAP[colorKey];
                    const isSelected = formData.color === colorKey;
                    return (
                      <button
                        type="button"
                        key={colorKey}
                        onClick={() => setFormData({ ...formData, color: colorKey })}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all capitalize text-xs font-bold ${
                          c.bg
                        } ${c.text} ${
                          isSelected ? 'border-slate-900 ring-2 ring-slate-900/20 scale-105' : 'border-transparent'
                        }`}
                        title={colorKey}
                      >
                        {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                >
                  <option value="once_daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily (Morning & Evening)</option>
                  <option value="three_times_daily">Three Times Daily (Morning, Afternoon, Evening)</option>
                  <option value="four_times_daily">Four Times Daily</option>
                  <option value="as_needed">As Needed (PRN)</option>
                </select>
              </div>

              {/* Schedule Times Builder */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Scheduled Intake Times (24h)
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {formData.scheduleTimes.map((time, idx) => (
                    <span
                      key={time}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-800 text-sm font-bold"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{time}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTime(idx)}
                        className="text-primary-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    id="customTimeInput"
                    defaultValue="12:00"
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('customTimeInput');
                      if (input?.value) handleAddTime(input.value);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                  >
                    + Add Time
                  </button>
                </div>
              </div>

              {/* Stock Quantity & Refill Alert */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Current Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Refill Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.refillAlertThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        refillAlertThreshold: parseInt(e.target.value, 10) || 5
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Prescribing Doctor & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Prescribing Doctor
                  </label>
                  <input
                    type="text"
                    value={formData.prescribingDoctor}
                    onChange={(e) =>
                      setFormData({ ...formData, prescribingDoctor: e.target.value })
                    }
                    placeholder="e.g., Dr. Robert Chen"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Special Notes
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g., Take with a full glass of milk"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMedicine(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary-600/20"
                >
                  {isSaving ? 'Saving...' : editingMedicine ? 'Update Medicine' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pause / Resume Confirmation Modal */}
      {pausingMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scaleUp">
            <h3 className="text-xl font-bold text-slate-900">
              {pausingMedicine.isPaused
                ? `Resume ${pausingMedicine.name}?`
                : `Pause ${pausingMedicine.name}?`}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {pausingMedicine.isPaused
                ? 'Resuming will automatically re-enable daily reminders and schedule generation for this medication.'
                : 'Pausing will temporarily stop reminders and remove future scheduled doses until you resume.'}
            </p>

            {!pausingMedicine.isPaused && (
              <div className="mt-4">
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Reason for pausing (optional)
                </label>
                <input
                  type="text"
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="e.g., Doctor temporarily paused for surgery"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            )}

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setPausingMedicine(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleTogglePause}
                className={`px-5 py-2 rounded-xl font-bold text-sm text-white ${
                  pausingMedicine.isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {pausingMedicine.isPaused ? 'Resume Medication' : 'Confirm Pause'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Delete {deletingMedicine.name}?
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete this medication? This will also remove any future scheduled doses. Historical completed dose records will remain preserved.
            </p>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeletingMedicine(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-sm text-white shadow-xs"
              >
                Delete Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Medicine Modal */}
      {detailMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{detailMedicine.name}</h3>
              <button
                onClick={() => setDetailMedicine(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">Dosage & Unit</span>
                <p className="font-bold text-slate-800">
                  {detailMedicine.dosage} {detailMedicine.dosageUnit} ({detailMedicine.form})
                </p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">Instructions</span>
                <p className="font-bold text-primary-700">{detailMedicine.instructions}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">Schedule Times</span>
                <p className="font-bold text-slate-800">{detailMedicine.scheduleTimes.join(', ')}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">Stock & Refill</span>
                <p className="font-semibold text-slate-700">
                  {detailMedicine.stockQuantity} remaining (Alert at {detailMedicine.refillAlertThreshold})
                </p>
              </div>

              {detailMedicine.prescribingDoctor && (
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 block">Prescribing Doctor</span>
                  <p className="font-semibold text-slate-800">{detailMedicine.prescribingDoctor}</p>
                </div>
              )}

              {detailMedicine.notes && (
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 block">Notes</span>
                  <p className="text-slate-600 italic">{detailMedicine.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setDetailMedicine(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
