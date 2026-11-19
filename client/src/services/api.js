import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach token and active patient delegation
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medremind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activePatientId = localStorage.getItem('medremind_active_patient_id');
    if (activePatientId) {
      config.headers['x-patient-id'] = activePatientId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are already on login or checking auth
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('medremind_token');
        localStorage.removeItem('medremind_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
