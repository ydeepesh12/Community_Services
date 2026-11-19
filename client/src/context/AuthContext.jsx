import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medremind_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('medremind_token') || null);
  const [loading, setLoading] = useState(true);
  const [activePatient, setActivePatientState] = useState(() => {
    const saved = localStorage.getItem('medremind_active_patient');
    return saved ? JSON.parse(saved) : null;
  });

  const isCaregiver = user?.role === 'caregiver';

  const switchPatient = (patient) => {
    if (!patient) {
      localStorage.removeItem('medremind_active_patient');
      localStorage.removeItem('medremind_active_patient_id');
      setActivePatientState(null);
    } else {
      localStorage.setItem('medremind_active_patient', JSON.stringify(patient));
      localStorage.setItem('medremind_active_patient_id', patient._id);
      setActivePatientState(patient);
    }
  };

  const fetchCurrentUser = async () => {
    const storedToken = localStorage.getItem('medremind_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('medremind_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Failed to verify session:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('medremind_token', receivedToken);
      localStorage.setItem('medremind_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('medremind_token', receivedToken);
      localStorage.setItem('medremind_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('medremind_token');
    localStorage.removeItem('medremind_user');
    localStorage.removeItem('medremind_active_patient');
    localStorage.removeItem('medremind_active_patient_id');
    setToken(null);
    setUser(null);
    setActivePatientState(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isCaregiver,
        activePatient,
        switchPatient,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
