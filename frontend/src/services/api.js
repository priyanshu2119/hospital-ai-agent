/**
 * api.js — Frontend API Client
 *
 * Centralized API client for all backend communication.
 * Uses Axios with a base URL configured via environment variable.
 *
 * API groups:
 *   - appointmentsAPI: CRUD operations for appointments
 *   - triageAPI: AI conversation, symptom analysis, audio transcription
 *   - hospitalAPI: Department, doctor, and service information
 *   - healthCheck: Backend connectivity verification
 *
 * Design decisions:
 *   - Uses Axios instance with shared config (baseURL, headers)
 *   - Response interceptor logs errors for debugging without crashing
 *   - Each API group is a plain object with descriptive method names
 *   - Removed LiveKit API references (service not implemented)
 */

import axios from 'axios';

/* ------------------------------------------------------------------ */
/*  Axios Instance Configuration                                      */
/* ------------------------------------------------------------------ */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, /* 30 second timeout for AI responses which can be slow */
});

/* ------------------------------------------------------------------ */
/*  Response Interceptor — Centralized Error Logging                  */
/* ------------------------------------------------------------------ */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    /* Log the error details for debugging */
    const errorInfo = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.detail || error.message,
    };

    console.error('[API Error]', errorInfo);

    /* Re-throw so component-level catch blocks can handle it */
    return Promise.reject(error);
  }
);

/* ------------------------------------------------------------------ */
/*  Appointments API                                                  */
/* ------------------------------------------------------------------ */

/**
 * CRUD operations for appointment management.
 * All endpoints are prefixed with /api/appointments.
 */
export const appointmentsAPI = {
  /** Fetch all appointments, optionally filtered by query params */
  getAll: (params) => api.get('/api/appointments', { params }),

  /** Fetch a single appointment by its ID */
  getById: (id) => api.get(`/api/appointments/${id}`),

  /** Create a new appointment */
  create: (data) => api.post('/api/appointments', data),

  /** Update an existing appointment */
  update: (id, data) => api.put(`/api/appointments/${id}`, data),

  /** Cancel (soft delete) an appointment */
  cancel: (id) => api.delete(`/api/appointments/${id}`),

  /** Get available time slots for a given date */
  getAvailableSlots: (data) => api.post('/api/appointments/available-slots', data),
};

/* ------------------------------------------------------------------ */
/*  Triage API                                                        */
/* ------------------------------------------------------------------ */

/**
 * AI-powered triage and conversation endpoints.
 * All endpoints are prefixed with /api/triage.
 */
export const triageAPI = {
  /** Analyze symptoms and get triage recommendation */
  analyzeSymptoms: (data) => api.post('/api/triage/analyze', data),

  /** Send conversation messages and get AI response (with optional TTS) */
  conversation: (data) => api.post('/api/triage/conversation', data),

  /** Upload audio file for speech-to-text transcription */
  transcribe: (formData) =>
    api.post('/api/triage/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

/* ------------------------------------------------------------------ */
/*  Hospital Info API                                                 */
/* ------------------------------------------------------------------ */

/**
 * Hospital information endpoints for departments, doctors, and services.
 * All endpoints are prefixed with /api/hospital.
 *
 * Note: These endpoints require the backend hospital router to be
 * implemented. If the backend doesn't have these endpoints yet,
 * the HospitalInfo component gracefully falls back to demo data.
 */
export const hospitalAPI = {
  /** Fetch all departments with their associated doctors */
  getDepartments: () => api.get('/api/hospital/departments'),

  /** Fetch a single department by ID */
  getDepartmentById: (id) => api.get(`/api/hospital/departments/${id}`),

  /** Fetch all doctors, optionally filtered by department */
  getDoctors: (params) => api.get('/api/hospital/doctors', { params }),

  /** Fetch a single doctor by ID */
  getDoctorById: (id) => api.get(`/api/hospital/doctors/${id}`),

  /** Fetch all hospital services */
  getServices: () => api.get('/api/hospital/services'),
};

/* ------------------------------------------------------------------ */
/*  Health Check                                                      */
/* ------------------------------------------------------------------ */

/** Quick connectivity check to verify the backend is running */
export const healthCheck = () => api.get('/health');

export default api;
