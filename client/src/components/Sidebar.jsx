import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Pill,
  CalendarCheck,
  History,
  BarChart3,
  Users,
  Settings,
  HeartPulse,
  PhoneCall,
  X,
  ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Medicines', path: '/medicines', icon: Pill },
  { name: 'Today Schedule', path: '/schedule', icon: CalendarCheck },
  { name: 'Dose History', path: '/history', icon: History },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Caregivers & Family', path: '/caregivers', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, activePatient } = useAuth();

  const emergency = activePatient?.emergencyContact || user?.emergencyContact;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-primary-500/25 group-hover:scale-105 transition-transform">
              <Pill className="w-6 h-6 transform -rotate-45" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight block">
                Med<span className="text-primary-600">Remind</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400 block tracking-wider uppercase">
                Care & Tracking
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-bold text-base transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-xs border border-primary-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Emergency Contact Quick Access Card (Pinned at bottom) */}
        {emergency && (emergency.phone || emergency.name) && (
          <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/80 shadow-xs">
            <div className="flex items-center space-x-2 text-rose-800 text-xs font-extrabold uppercase tracking-wider mb-1">
              <HeartPulse className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Emergency Contact</span>
            </div>
            <p className="text-sm font-bold text-slate-900 truncate">
              {emergency.name || 'Primary Care Contact'}
            </p>
            {emergency.relationship && (
              <p className="text-xs text-slate-500 font-medium">({emergency.relationship})</p>
            )}

            {emergency.phone ? (
              <a
                href={`tel:${emergency.phone}`}
                className="mt-2.5 w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {emergency.phone}</span>
              </a>
            ) : (
              <Link
                to="/settings"
                className="mt-2 block text-center text-xs font-bold text-rose-700 underline"
              >
                Add Phone Number
              </Link>
            )}
          </div>
        )}

        {/* Footer badge */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure Patient Data</span>
          </div>
          <span>v1.0</span>
        </div>
      </aside>
    </>
  );
}
