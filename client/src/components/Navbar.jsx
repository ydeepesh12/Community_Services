import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useReminder } from '../context/ReminderContext';
import {
  Bell,
  Volume2,
  Users,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { user, isCaregiver, activePatient, switchPatient, logout } = useAuth();
  const { fontSize, setFontSize, highContrast, setHighContrast, theme, setTheme } = useAccessibility();
  const { testReminder, notificationPermission, requestPermission, upcomingReminders } = useReminder();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const pendingCount = upcomingReminders.filter((d) => d.status === 'pending').length;

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      {/* Caregiver Active Patient Banner (if caregiver is delegating) */}
      {isCaregiver && activePatient && (
        <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white px-4 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-teal-200" />
            <span className="font-medium">
              Assisting Patient: <strong className="font-bold underline">{activePatient.name}</strong>
            </span>
          </div>
          <button
            onClick={() => switchPatient(null)}
            className="text-xs bg-white/20 hover:bg-white/30 text-white font-medium px-2.5 py-1 rounded-lg transition-colors"
          >
            Switch to My Account
          </button>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden sm:block">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {activePatient ? `${activePatient.name}'s Care Dashboard` : 'Medication Dashboard'}
            </h1>
            <p className="text-xs font-medium text-slate-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Right Side: Accessibility Controls, Test Sound, Notifications, Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Elderly Font Sizing Selector */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fontSize === 'normal' ? 'bg-white shadow-xs text-primary-700' : 'hover:text-slate-900'
              }`}
              title="Normal Text Size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fontSize === 'large' ? 'bg-white shadow-xs text-primary-700 font-extrabold' : 'hover:text-slate-900'
              }`}
              title="Large Text Size (Elderly friendly)"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('extra-large')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fontSize === 'extra-large' ? 'bg-white shadow-xs text-primary-700 font-black' : 'hover:text-slate-900'
              }`}
              title="Extra Large Text Size"
            >
              A++
            </button>
          </div>

          {/* High Contrast Toggle Button */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1 ${
              highContrast
                ? 'bg-slate-900 text-yellow-300 border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle High Contrast for clearer visibility"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden xl:inline">Contrast</span>
          </button>

          {/* Sound & Voice Audio Test */}
          <button
            onClick={() => testReminder()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-primary-50 hover:border-primary-200 text-slate-700 hover:text-primary-700 transition-all flex items-center space-x-1.5"
            title="Test reminder chime & voice readout"
          >
            <Volume2 className="w-4 h-4 text-primary-600" />
            <span className="hidden sm:inline text-xs font-semibold">Test Alert</span>
          </button>

          {/* Browser Notification Permission Banner or Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="relative p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-40 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Medication Alerts</h3>
                  <span className="text-xs text-slate-500">{upcomingReminders.length} Scheduled</span>
                </div>

                {notificationPermission !== 'granted' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <p className="font-semibold mb-1.5">Desktop Notifications</p>
                    <p className="mb-2 text-slate-600">
                      Enable desktop alerts so you never miss a scheduled dose even while working.
                    </p>
                    <button
                      onClick={requestPermission}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
                    >
                      Enable Notifications
                    </button>
                  </div>
                )}

                <div className="mt-3 max-h-56 overflow-y-auto space-y-2">
                  {upcomingReminders.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No upcoming doses today.</p>
                  ) : (
                    upcomingReminders.slice(0, 5).map((dose) => (
                      <div
                        key={dose._id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{dose.medicine?.name}</p>
                          <p className="text-slate-500">{dose.scheduledTime} • {dose.dosage} {dose.dosageUnit}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          dose.status === 'taken' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {dose.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                  <Link
                    to="/schedule"
                    onClick={() => setShowNotificationMenu(false)}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700"
                  >
                    View Full Schedule &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-2xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-sky-400 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left pr-1">
                <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider">
                  {user?.role || 'Patient'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 animate-fadeIn">
                <div className="p-3 border-b border-slate-100">
                  <p className="font-bold text-slate-900 text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Profile & Settings
                  </Link>
                  <Link
                    to="/caregivers"
                    onClick={() => setShowProfileMenu(false)}
                    className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Family & Caregivers
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
