import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Copy,
  Check,
  Trash2,
  Edit,
  ArrowRight,
  Heart,
  Key,
  CalendarCheck,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CaregiversPage() {
  const { user, isCaregiver, activePatient, switchPatient } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [caregiverData, setCaregiverData] = useState({ caregivers: [], patients: [] });

  // Generate Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteRelationship, setInviteRelationship] = useState('Son / Daughter');
  const [invitePermissions, setInvitePermissions] = useState({
    canView: true,
    canLogDose: true,
    canEditMedicines: false
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Caregiver enter code
  const [enterCode, setEnterCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const res = await api.get('/caregivers');
      if (res.data.success) {
        setCaregiverData({
          caregivers: res.data.caregivers || [],
          patients: res.data.patients || []
        });
      }
    } catch (err) {
      console.error('Failed to load caregiver relationships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [user]);

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/caregivers/invite', {
        relationship: inviteRelationship,
        permissions: invitePermissions
      });
      if (res.data.success) {
        setGeneratedCode(res.data.inviteCode);
        await fetchRelationships();
      }
    } catch (err) {
      alert('Failed to generate invite code.');
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleLinkCaregiver = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    setIsLinking(true);

    try {
      const res = await api.post('/caregivers/link', { inviteCode: enterCode });
      if (res.data.success) {
        setLinkSuccess(res.data.message);
        setEnterCode('');
        await fetchRelationships();
      }
    } catch (err) {
      setLinkError(err.response?.data?.message || 'Failed to link account. Please verify code.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleRemoveRelationship = async (relId) => {
    if (!confirm('Are you sure you want to remove this caregiver connection?')) return;
    try {
      await api.delete(`/caregivers/${relId}`);
      await fetchRelationships();
    } catch (err) {
      alert('Failed to remove relationship.');
    }
  };

  const handleSelectPatientToAssist = (pat) => {
    switchPatient(pat);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Family & Caregiver Support
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Connect trusted family members, sons, daughters, and healthcare aides with granular permissions.
          </p>
        </div>

        {user?.role === 'patient' && (
          <button
            onClick={() => {
              setGeneratedCode('');
              setIsInviteModalOpen(true);
            }}
            className="py-3 px-5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary-600/20 flex items-center justify-center space-x-2 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            <span>Invite a Caregiver</span>
          </button>
        )}
      </div>

      {/* For Caregivers: Link With Code Box */}
      {(user?.role === 'caregiver' || caregiverData.patients.length > 0) && (
        <div className="bg-gradient-to-br from-teal-50 via-sky-50 to-blue-50 border-2 border-teal-200 p-6 rounded-3xl shadow-soft">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Link to an Elderly Patient's Account
              </h3>
              <p className="text-xs text-slate-600">
                Enter the 6-character Invite Code provided by your parent or relative.
              </p>
            </div>
          </div>

          <form onSubmit={handleLinkCaregiver} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={enterCode}
              onChange={(e) => setEnterCode(e.target.value.toUpperCase())}
              placeholder="e.g., CARE-77192"
              className="flex-1 px-4 py-2.5 rounded-xl border border-teal-300 uppercase tracking-widest font-black text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <button
              type="submit"
              disabled={isLinking}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xs transition-colors shrink-0"
            >
              {isLinking ? 'Linking...' : 'Connect to Patient'}
            </button>
          </form>

          {linkError && (
            <p className="mt-3 text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {linkError}
            </p>
          )}

          {linkSuccess && (
            <p className="mt-3 text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              {linkSuccess}
            </p>
          )}
        </div>
      )}

      {/* Patients Section (For Caregivers) */}
      {caregiverData.patients.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Patients Under Your Care</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caregiverData.patients.map((item) => {
              const p = item.patient;
              const isSelected = activePatient?._id === p._id;

              return (
                <div
                  key={item.relationshipId}
                  className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-teal-50/60 border-teal-400 shadow-md'
                      : 'bg-white border-slate-200 shadow-soft'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-lg shadow-xs">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900">{p.name}</h4>
                          <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                            {item.relationship}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-xs font-extrabold text-teal-800 bg-teal-200 px-3 py-1 rounded-full flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active View</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                      <p className="text-slate-600">
                        <strong>Email:</strong> {p.email}
                      </p>
                      {p.phone && (
                        <p className="text-slate-600">
                          <strong>Phone:</strong> {p.phone}
                        </p>
                      )}
                      <p className="text-slate-600">
                        <strong>Permissions:</strong> View Schedule •{' '}
                        {item.permissions.canLogDose ? 'Log Doses' : 'View Only'} •{' '}
                        {item.permissions.canEditMedicines ? 'Edit Prescriptions' : 'Read-only Meds'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleRemoveRelationship(item.relationshipId)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700"
                    >
                      Disconnect
                    </button>

                    <button
                      onClick={() => handleSelectPatientToAssist(p)}
                      className={`py-2 px-4 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-teal-700 text-white'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      <span>{isSelected ? 'Currently Managing' : 'Switch to Patient View'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Linked Caregivers Section (For Patients) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-1">Your Connected Caregivers</h3>
        <p className="text-xs font-semibold text-slate-500 mb-5">
          These family members or nursing staff have permission to assist you with medication.
        </p>

        {caregiverData.caregivers.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No caregivers connected yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Share an invite code with your family members so they can monitor and assist with your health.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {caregiverData.caregivers.map((rel) => {
              const cg = rel.caregiver;
              const isPending = rel.status === 'pending';

              return (
                <div
                  key={rel._id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-black flex items-center justify-center">
                      {cg?.name ? cg.name.charAt(0) : 'C'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {cg?.name || 'Pending Caregiver Invite'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {rel.relationship} • {cg?.email || `Code: ${rel.inviteCode}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        isPending
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {rel.status}
                    </span>

                    <button
                      onClick={() => handleRemoveRelationship(rel._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                      title="Remove Connection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scaleUp">
            <h3 className="text-xl font-bold text-slate-900">Invite a Family Caregiver</h3>
            <p className="text-xs text-slate-500 mt-1">
              Generate a unique invitation code for your son, daughter, or nurse.
            </p>

            {!generatedCode ? (
              <form onSubmit={handleGenerateInvite} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteRelationship}
                    onChange={(e) => setInviteRelationship(e.target.value)}
                    placeholder="e.g., Son, Daughter, Home Nurse"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>

                {/* Permissions checkboxes */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Permissions Granted
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={invitePermissions.canView}
                      onChange={(e) =>
                        setInvitePermissions({ ...invitePermissions, canView: e.target.checked })
                      }
                      className="rounded text-primary-600"
                    />
                    <span>Can view schedule and medication history</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={invitePermissions.canLogDose}
                      onChange={(e) =>
                        setInvitePermissions({ ...invitePermissions, canLogDose: e.target.checked })
                      }
                      className="rounded text-primary-600"
                    />
                    <span>Can record and mark doses as taken</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={invitePermissions.canEditMedicines}
                      onChange={(e) =>
                        setInvitePermissions({
                          ...invitePermissions,
                          canEditMedicines: e.target.checked
                        })
                      }
                      className="rounded text-primary-600"
                    />
                    <span>Can add, update, and pause medicines</span>
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-xs"
                  >
                    Generate Code
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-primary-50 rounded-2xl border-2 border-primary-200 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
                    Caregiver Invite Code
                  </span>
                  <p className="text-3xl font-black text-slate-900 tracking-widest mt-1">
                    {generatedCode}
                  </p>
                </div>

                <p className="text-xs text-slate-600 text-center">
                  Share this code with your family member. When they log into MedRemind, they can enter this code to connect.
                </p>

                <button
                  onClick={handleCopyCode}
                  className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-xs flex items-center justify-center space-x-2"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Code Copied to Clipboard!' : 'Copy Invite Code'}</span>
                </button>

                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
