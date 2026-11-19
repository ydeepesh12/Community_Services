import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ReminderProvider } from './context/ReminderContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import DashboardPage from './pages/DashboardPage';
import MedicinesPage from './pages/MedicinesPage';
import SchedulePage from './pages/SchedulePage';
import TrackingHistoryPage from './pages/TrackingHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CaregiversPage from './pages/CaregiversPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <AuthProvider>
          <ReminderProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="medicines" element={<MedicinesPage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="history" element={<TrackingHistoryPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="caregivers" element={<CaregiversPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ReminderProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}
