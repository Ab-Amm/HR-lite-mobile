import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { employeeApi, contractApi, leaveApi, authApi, decodeJwt } from '../api/api';

const AppContext = createContext(null);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // Current Employee (for employee role)
    const [currentEmployee, setCurrentEmployee] = useState(null);

    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        totalEmployees: 0,
        employeesOnLeave: 0,
        date: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const clearError = useCallback(() => setError(null), []);

    // Auth Logic
    const login = useCallback(async (username, password) => {
        try {
            setLoading(true);
            const response = await authApi.login(username, password);
            // Handle both response structures (direct or wrapped in data)
            const data = response.data.data || response.data;
            const { token, role } = data;
            
            // Decode JWT to get user ID
            const decoded = decodeJwt(token);
            const extractedUserId = decoded?.userId || decoded?.sub || decoded?.id;
            
            await SecureStore.setItemAsync('userToken', token);
            if (role) {
                await SecureStore.setItemAsync('userRole', role);
            }
            if (extractedUserId) {
                await SecureStore.setItemAsync('userId', String(extractedUserId));
            }
            
            setUserToken(token);
            setUserRole(role);
            setUserId(extractedUserId);
            setError(null);
            return true;
        } catch (err) {
            setError('Login failed. Please check your credentials.');
            console.error('Login error:', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userRole');
            await SecureStore.deleteItemAsync('userId');
            setUserToken(null);
            setUserRole(null);
            setUserId(null);
            setCurrentEmployee(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    }, []);

    // Restore token on app start
    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                const token = await SecureStore.getItemAsync('userToken');
                const role = await SecureStore.getItemAsync('userRole');
                const storedUserId = await SecureStore.getItemAsync('userId');
                setUserToken(token);
                setUserRole(role);
                setUserId(storedUserId ? Number(storedUserId) : null);
            } catch (e) {
                console.error('Restoring token failed', e);
            } finally {
                setIsAuthLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    // Auto-fetch employee data when userId and role are available
    useEffect(() => {
        const loadEmployeeData = async () => {
            if (userId && userRole === 'EMPLOYEE' && !currentEmployee) {
                try {
                    const response = await employeeApi.getById(userId);
                    setCurrentEmployee(response.data);
                } catch (err) {
                    console.error('Failed to pre-fetch employee data:', err);
                }
            }
        };
        loadEmployeeData();
    }, [userId, userRole, currentEmployee]);

    // Fetch current employee profile (for employee users)
    const fetchCurrentEmployee = useCallback(async (forceRefresh = false) => {
        if (!userId) return null;
        // Return cached data if available and not forcing refresh
        if (currentEmployee && !forceRefresh) {
            return currentEmployee;
        }
        try {
            setLoading(true);
            // Fetch employee by the user ID from JWT
            const response = await employeeApi.getById(userId);
            setCurrentEmployee(response.data);
            setError(null);
            return response.data;
        } catch (err) {
            console.error('Failed to fetch current employee:', err);
            setError('Failed to load profile');
            return null;
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Dashboard
    const fetchDashboardStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await employeeApi.getDashboardStats();
            setDashboardStats(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load dashboard');
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Employees
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const response = await employeeApi.getAll();
            setEmployees(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load employees');
            console.error('Employees error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEmployeeById = useCallback(async (id) => {
        try {
            setLoading(true);
            const response = await employeeApi.getById(id);
            setSelectedEmployee(response.data);
            setError(null);
            return response.data;
        } catch (err) {
            setError('Failed to load employee');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createEmployee = useCallback(async (data) => {
        try {
            setLoading(true);
            const response = await employeeApi.create(data);
            setEmployees((prev) => [...prev, response.data]);
            return response.data;
        } catch (err) {
            setError('Failed to create employee');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateEmployee = useCallback(async (id, data) => {
        try {
            setLoading(true);
            const response = await employeeApi.update(id, data);
            setEmployees((prev) => prev.map((e) => e.id === id ? response.data : e));
            setSelectedEmployee(response.data);
            return response.data;
        } catch (err) {
            setError('Failed to update employee');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteEmployee = useCallback(async (id) => {
        try {
            setLoading(true);
            await employeeApi.delete(id);
            setEmployees((prev) => prev.filter((e) => e.id !== id));
            setSelectedEmployee(null);
        } catch (err) {
            setError('Failed to delete employee');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Contracts
    const fetchContractsByEmployee = useCallback(async (employeeId) => {
        try {
            setLoading(true);
            const response = await contractApi.getByEmployeeId(employeeId);
            setContracts(response.data);
            return response.data;
        } catch (err) {
            setError('Failed to load contracts');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Leaves
    const fetchLeavesByEmployee = useCallback(async (employeeId) => {
        try {
            setLoading(true);
            const response = await leaveApi.getByEmployeeId(employeeId);
            setLeaveRequests(response.data);
            return response.data;
        } catch (err) {
            setError('Failed to load leaves');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPendingLeaves = useCallback(async () => {
        try {
            setLoading(true);
            const response = await leaveApi.getPending();
            setPendingLeaves(response.data);
            return response.data;
        } catch (err) {
            setError('Failed to load pending leaves');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createLeaveRequest = useCallback(async (employeeId, data) => {
        try {
            setLoading(true);
            const response = await leaveApi.create(employeeId, data);
            setLeaveRequests((prev) => [response.data, ...prev]);
            return response.data;
        } catch (err) {
            setError('Failed to create leave');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const approveLeave = useCallback(async (id) => {
        try {
            setLoading(true);
            const response = await leaveApi.approve(id);
            setPendingLeaves((prev) => prev.filter((l) => l.id !== id));
            return response.data;
        } catch (err) {
            setError('Failed to approve');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const rejectLeave = useCallback(async (id) => {
        try {
            setLoading(true);
            const response = await leaveApi.reject(id);
            setPendingLeaves((prev) => prev.filter((l) => l.id !== id));
            return response.data;
        } catch (err) {
            setError('Failed to reject');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const value = {
        userToken,
        userRole,
        userId,
        isAuthLoading,
        login,
        logout,
        currentEmployee,
        fetchCurrentEmployee,
        employees,
        selectedEmployee,
        contracts,
        leaveRequests,
        pendingLeaves,
        dashboardStats,
        loading,
        error,
        clearError,
        fetchDashboardStats,
        fetchEmployees,
        fetchEmployeeById,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        fetchContractsByEmployee,
        fetchLeavesByEmployee,
        fetchPendingLeaves,
        createLeaveRequest,
        approveLeave,
        rejectLeave,
        setSelectedEmployee,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
