import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Lock, Mail, ArrowRight, ShieldCheck, HeartPulse, User, Users } from 'lucide-react';
import api from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: set new password
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);

    try {
      if (forgotStep === 1) {
        const res = await api.post('/auth/forgot-password', { email: forgotEmail });
        if (res.data.success) {
          setForgotStep(2);
          setForgotMessage('Email verified. Enter your new password below.');
        }
      } else {
        const res = await api.post('/auth/forgot-password', {
          email: forgotEmail,
          newPassword: newResetPassword
        });
        if (res.data.success) {
          setForgotMessage('Password reset successfully! You can now log in.');
          setTimeout(() => {
            setShowForgot(false);
            setForgotStep(1);
            setEmail(forgotEmail);
          }, 1500);
        }
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Password reset request failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-blue-50 flex items-center justify-center p-4 selection:bg-primary-500 selection:text-white">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-10 relative overflow-hidden animate-scaleUp">
        {/* Top Decorative Pill Glow */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-primary-500/30 mb-4 transform hover:rotate-12 transition-transform">
          <Pill className="w-9 h-9 transform -rotate-45" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome to MedRemind
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Caregiver-assisted medicine reminder & tracking system
          </p>
        </div>

        {/* Demo Fast-Login Strip */}
        <div className="mt-5 p-3 rounded-2xl bg-sky-50/80 border border-sky-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-primary-800 block mb-2 text-center">
            ⚡ Quick Demo Accounts (One-Click Fill)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('patient@example.com', 'password123')}
              className="py-2 px-2.5 rounded-xl bg-white hover:bg-sky-100 text-primary-700 text-xs font-bold border border-sky-200 shadow-2xs transition-colors flex items-center justify-center space-x-1"
            >
              <User className="w-3.5 h-3.5 text-primary-600" />
              <span>Eleanor (Patient)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('caregiver@example.com', 'password123')}
              className="py-2 px-2.5 rounded-xl bg-white hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 shadow-2xs transition-colors flex items-center justify-center space-x-1"
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>Mark (Caregiver)</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgot(true);
                }}
                className="text-xs font-bold text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-base shadow-lg shadow-primary-600/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-semibold text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-extrabold text-primary-600 hover:underline">
            Register Here
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>HIPAA-aligned Patient Encryption</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-scaleUp">
            <h3 className="text-xl font-bold text-slate-900">Reset Account Password</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered email address to verify your account and set a new password.
            </p>

            {forgotError && (
              <p className="mt-3 text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {forgotError}
              </p>
            )}

            {forgotMessage && (
              <p className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                {forgotMessage}
              </p>
            )}

            <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              {forgotStep === 2 && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotStep(1);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-xs"
                >
                  {forgotLoading
                    ? 'Processing...'
                    : forgotStep === 1
                    ? 'Verify Email'
                    : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
