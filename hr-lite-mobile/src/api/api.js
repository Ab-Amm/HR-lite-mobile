import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// =====================================================
// PHYSICAL DEVICE: Using your machine's local IP
// Change this IP if your network changes
// =====================================================
const BASE_URL = 'http://192.168.0.117:8080/api';

// For Android Emulator only, uncomment this instead:
// const BASE_URL = 'http://10.0.2.2:8080/api';

// For iOS Simulator only, uncomment this instead:
// const BASE_URL = 'http://localhost:8080/api';

// Create Axios instance with default configuration
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor for logging and Auth
api.interceptors.request.use(
    async (config) => {
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
        
        const token = await SecureStore.getItemAsync('userToken');
        console.log('Using token:', token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for logging
api.interceptors.response.use(
    (response) => {
        console.log(`📥 ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('❌ Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================

export const authApi = {
    login: (username, password) => api.post('/auth/login', { userName: username, password }),
};

// ==================== EMPLOYEE API ====================

export const employeeApi = {
    getDashboardStats: () => api.get('/employees/dashboard'),
    getAll: () => api.get('/employees'),
    getById: (id) => api.get(`/employees/${id}`),
    create: (employee) => api.post('/employees', employee),
    update: (id, employee) => api.put(`/employees/${id}`, employee),
    delete: (id) => api.delete(`/employees/${id}`),
};

// ==================== CONTRACT API ====================

export const contractApi = {
    getAll: () => api.get('/contracts'),
    getByEmployeeId: (employeeId) => api.get(`/contracts/employee/${employeeId}`),
    create: (employeeId, contract) => api.post(`/contracts/employee/${employeeId}`, contract),
    update: (id, contract) => api.put(`/contracts/${id}`, contract),
    delete: (id) => api.delete(`/contracts/${id}`),
};

// ==================== LEAVE REQUEST API ====================

export const leaveApi = {
    getAll: () => api.get('/leaves'),
    getPending: () => api.get('/leaves/pending'),
    getByEmployeeId: (employeeId) => api.get(`/leaves/employee/${employeeId}`),
    getByStatus: (status) => api.get(`/leaves/status/${status}`),
    create: (employeeId, leaveRequest) => api.post(`/leaves/employee/${employeeId}`, leaveRequest),
    approve: (id) => api.patch(`/leaves/${id}/approve`),
    reject: (id) => api.patch(`/leaves/${id}/reject`),
    update: (id, leaveRequest) => api.put(`/leaves/${id}`, leaveRequest),
    delete: (id) => api.delete(`/leaves/${id}`),
};

// ==================== ATTENDANCE API ====================

export const attendanceApi = {
    getToday: (employeeId) => api.get(`/attendance/today?employeeId=${employeeId}`),
    checkIn: (employeeId) => api.post(`/attendance/check-in?employeeId=${employeeId}`),
    checkOut: (employeeId) => api.post(`/attendance/check-out?employeeId=${employeeId}`),
    getHistory: (employeeId) => api.get(`/attendance/history?employeeId=${employeeId}`),
    getStats: () => api.get('/attendance/stats'),
};

export default api;
