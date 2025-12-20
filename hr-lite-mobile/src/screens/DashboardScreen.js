import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Modal } from 'react-native';
import { Card, Text, Button, Surface, ActivityIndicator, Portal, Dialog, TextInput, IconButton, Divider, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { attendanceApi, authApi } from '../api/api';
import { colors, spacing, shadows, typography, borderRadius } from '../theme/theme';

// For MVP, we'll use a hardcoded employee ID (first employee)
const CURRENT_EMPLOYEE_ID = 1;

const DashboardScreen = ({ navigation }) => {
    const { dashboardStats, loading, fetchDashboardStats, fetchPendingLeaves, pendingLeaves, logout, userId } = useApp();
    const [refreshing, setRefreshing] = useState(false);
    const [attendance, setAttendance] = useState(null);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        try {
            setPasswordLoading(true);
            await authApi.changePassword(userId, passwordForm.oldPassword, passwordForm.newPassword);
            Alert.alert('Success', 'Password changed successfully');
            setShowPasswordDialog(false);
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            Alert.alert('Error', error.response?.data || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const fetchAttendance = useCallback(async () => {
        try {
            const response = await attendanceApi.getToday(CURRENT_EMPLOYEE_ID);
            setAttendance(response.data);
        } catch (err) {
            console.error('Attendance fetch error:', err);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardStats();
            fetchPendingLeaves();
            fetchAttendance();
        }, [fetchDashboardStats, fetchPendingLeaves, fetchAttendance])
    );

    // Timer for elapsed time when checked in
    useEffect(() => {
        let interval;
        if (attendance?.checkInTime && !attendance?.checkOutTime) {
            const calculateElapsed = () => {
                const checkIn = new Date(attendance.checkInTime);
                const now = new Date();
                const diffMs = now - checkIn;
                setElapsedTime(Math.floor(diffMs / 1000)); // in seconds
            };
            calculateElapsed();
            interval = setInterval(calculateElapsed, 1000);
        }
        return () => clearInterval(interval);
    }, [attendance]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchDashboardStats(), fetchPendingLeaves(), fetchAttendance()]);
        setRefreshing(false);
    }, [fetchDashboardStats, fetchPendingLeaves, fetchAttendance]);

    const handleCheckIn = async () => {
        try {
            setAttendanceLoading(true);
            const response = await attendanceApi.checkIn(CURRENT_EMPLOYEE_ID);
            setAttendance(response.data);
            Alert.alert('Success', 'You have checked in!');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to check in');
        } finally {
            setAttendanceLoading(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setAttendanceLoading(true);
            const response = await attendanceApi.checkOut(CURRENT_EMPLOYEE_ID);
            setAttendance(response.data);
            Alert.alert('Success', 'You have checked out! Have a great day!');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to check out');
        } finally {
            setAttendanceLoading(false);
        }
    };

    const formatElapsedTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs}h ${mins}m ${secs}s`;
    };

    const formatWorkedTime = (minutes) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h ${mins}m`;
    };

    const StatCard = ({ title, value, icon, color, onPress }) => (
        <Surface style={[styles.statCard, shadows.medium]} elevation={2} onTouchEnd={onPress}>
            <View style={styles.statCardContent}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <MaterialCommunityIcons name={icon} size={28} color={color} />
                </View>
                <View style={styles.statTextContainer}>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statTitle}>{title}</Text>
                </View>
            </View>
        </Surface>
    );

    const AttendanceCard = () => {
        const hasCheckedIn = attendance?.checkInTime != null;
        const hasCheckedOut = attendance?.checkOutTime != null;

        if (hasCheckedOut) {
            // Day Complete
            return (
                <Card style={[styles.attendanceCard, shadows.medium, { borderLeftColor: colors.success }]}>
                    <Card.Content>
                        <View style={styles.attendanceHeader}>
                            <MaterialCommunityIcons name="check-circle" size={32} color={colors.success} />
                            <Text style={[styles.attendanceTitle, { color: colors.success }]}>Day Complete! 🎉</Text>
                        </View>
                        <View style={styles.workedContainer}>
                            <Text style={styles.workedLabel}>Today you worked</Text>
                            <Text style={styles.workedTime}>{formatWorkedTime(attendance.workedMinutes || 0)}</Text>
                        </View>
                        <Text style={styles.attendanceSubtitle}>
                            Check-in: {new Date(attendance.checkInTime).toLocaleTimeString()} •
                            Check-out: {new Date(attendance.checkOutTime).toLocaleTimeString()}
                        </Text>
                    </Card.Content>
                </Card>
            );
        }

        if (hasCheckedIn) {
            // Checked In - Show Check Out button
            return (
                <Card style={[styles.attendanceCard, shadows.medium, { borderLeftColor: colors.warning }]}>
                    <Card.Content>
                        <View style={styles.attendanceHeader}>
                            <MaterialCommunityIcons name="clock-outline" size={32} color={colors.warning} />
                            <Text style={[styles.attendanceTitle, { color: colors.warning }]}>Working...</Text>
                        </View>
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerLabel}>Time elapsed</Text>
                            <Text style={styles.timerValue}>{formatElapsedTime(elapsedTime)}</Text>
                        </View>
                        <Text style={styles.attendanceSubtitle}>
                            Checked in at {new Date(attendance.checkInTime).toLocaleTimeString()}
                        </Text>
                        <Button
                            mode="contained"
                            onPress={handleCheckOut}
                            loading={attendanceLoading}
                            disabled={attendanceLoading}
                            style={[styles.attendanceButton, { backgroundColor: colors.warning }]}
                            icon="logout"
                        >
                            CHECK OUT
                        </Button>
                    </Card.Content>
                </Card>
            );
        }

        // Not Checked In
        return (
            <Card style={[styles.attendanceCard, shadows.medium, { borderLeftColor: colors.success }]}>
                <Card.Content>
                    <View style={styles.attendanceHeader}>
                        <MaterialCommunityIcons name="login" size={32} color={colors.success} />
                        <Text style={[styles.attendanceTitle, { color: colors.textPrimary }]}>Good Day! 👋</Text>
                    </View>
                    <Text style={styles.attendanceSubtitle}>
                        Ready to start your day? Check in now!
                    </Text>
                    <Button
                        mode="contained"
                        onPress={handleCheckIn}
                        loading={attendanceLoading}
                        disabled={attendanceLoading}
                        style={[styles.attendanceButton, { backgroundColor: colors.success }]}
                        icon="login"
                    >
                        CHECK IN
                    </Button>
                </Card.Content>
            </Card>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            <Surface style={styles.headerCard} elevation={3}>
                <View style={styles.headerTopRow}>
                    <View style={styles.userInfo}>
                        <Avatar.Icon size={48} icon="account-tie" style={{ backgroundColor: colors.primaryLight }} />
                        <View style={styles.userTextContainer}>
                            <Text style={styles.greeting}>Welcome back,</Text>
                            <Text style={styles.userName}>HR Manager</Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <IconButton 
                            icon="lock-reset" 
                            size={24} 
                            iconColor={colors.primary} 
                            onPress={() => setShowPasswordDialog(true)} 
                            style={styles.actionButton}
                        />
                        <IconButton 
                            icon="logout" 
                            size={24} 
                            iconColor={colors.error} 
                            onPress={logout} 
                            style={styles.actionButton}
                        />
                    </View>
                </View>
                <Divider style={styles.headerDivider} />
                <View style={styles.dateRow}>
                    <MaterialCommunityIcons name="calendar-month" size={18} color={colors.textSecondary} />
                    <Text style={styles.dateText}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                </View>
            </Surface>

            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsRow}>
                <StatCard title="Total Employees" value={dashboardStats.totalEmployees || 0} icon="account-group" color={colors.primary} onPress={() => navigation.navigate('Employees')} />
                <StatCard title="On Leave Today" value={dashboardStats.employeesOnLeave || 0} icon="beach" color={colors.warning} onPress={() => navigation.navigate('EmployeesOnLeave')} />
            </View>

            <Card style={[styles.pendingCard, shadows.medium]}>
                <Card.Content>
                    <View style={styles.pendingHeader}>
                        <MaterialCommunityIcons name="clock-outline" size={24} color={colors.warning} />
                        <Text style={styles.pendingTitle}>Pending Requests</Text>
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>{pendingLeaves.length}</Text>
                        </View>
                    </View>
                    <Text style={styles.pendingSubtitle}>
                        {pendingLeaves.length > 0 ? `${pendingLeaves.length} leave request(s) awaiting approval` : 'No pending requests'}
                    </Text>
                </Card.Content>
                <Card.Actions>
                    <Button mode="text" onPress={() => navigation.navigate('Leaves')} textColor={colors.primary}>View All</Button>
                </Card.Actions>
            </Card>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
                <Button mode="contained" icon="account-plus" onPress={() => navigation.navigate('AddEmployee')} style={styles.quickButton}>
                    Add Employee
                </Button>
            </View>

            <Card style={[styles.navCard, shadows.small]} onPress={() => navigation.navigate('Employees')}>
                <Card.Content style={styles.navCardContent}>
                    <MaterialCommunityIcons name="account-search" size={32} color={colors.primary} />
                    <View style={styles.navCardText}>
                        <Text style={styles.navCardTitle}>Employee Directory</Text>
                        <Text style={styles.navCardSubtitle}>View and manage all employees</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </Card.Content>
            </Card>
            </ScrollView>

            <Portal>
                <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)} style={{ backgroundColor: 'white' }}>
                    <Dialog.Title>Change Password</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Current Password"
                            value={passwordForm.oldPassword}
                            onChangeText={(text) => setPasswordForm({ ...passwordForm, oldPassword: text })}
                            secureTextEntry
                            mode="outlined"
                            style={{ marginBottom: 10, backgroundColor: 'white' }}
                        />
                        <TextInput
                            label="New Password"
                            value={passwordForm.newPassword}
                            onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                            secureTextEntry
                            mode="outlined"
                            style={{ marginBottom: 10, backgroundColor: 'white' }}
                        />
                        <TextInput
                            label="Confirm New Password"
                            value={passwordForm.confirmPassword}
                            onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                            secureTextEntry
                            mode="outlined"
                            style={{ backgroundColor: 'white' }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowPasswordDialog(false)} textColor={colors.textSecondary}>Cancel</Button>
                        <Button onPress={handleChangePassword} loading={passwordLoading} disabled={passwordLoading}>Update</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: spacing.md, paddingBottom: spacing.xxl },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    loadingText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: typography.body },
    
    // Header Styles
    headerCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userTextContainer: {
        marginLeft: spacing.md,
    },
    greeting: {
        fontSize: typography.caption,
        color: colors.textSecondary,
    },
    userName: {
        fontSize: typography.h3,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
    },
    actionButton: {
        margin: 0,
    },
    headerDivider: {
        marginVertical: spacing.sm,
        backgroundColor: colors.border,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateText: {
        marginLeft: spacing.xs,
        fontSize: typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '500',
    },

    sectionTitle: { fontSize: typography.h4, fontWeight: typography.semiBold, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.md },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md },
    statCardContent: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 48, height: 48, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    statTextContainer: { flex: 1 },
    statValue: { fontSize: typography.h2, fontWeight: typography.bold, color: colors.textPrimary },
    statTitle: { fontSize: typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    // Attendance Card
    attendanceCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderLeftWidth: 5 },
    attendanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    attendanceTitle: { fontSize: typography.h3, fontWeight: typography.bold, marginLeft: spacing.sm },
    attendanceSubtitle: { fontSize: typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
    attendanceButton: { marginTop: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
    timerContainer: { alignItems: 'center', marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.warning + '15', borderRadius: borderRadius.md },
    timerLabel: { fontSize: typography.caption, color: colors.textSecondary },
    timerValue: { fontSize: typography.h1, fontWeight: typography.bold, color: colors.warning, marginTop: spacing.xs },
    workedContainer: { alignItems: 'center', marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.success + '15', borderRadius: borderRadius.md },
    workedLabel: { fontSize: typography.caption, color: colors.textSecondary },
    workedTime: { fontSize: typography.h1, fontWeight: typography.bold, color: colors.success, marginTop: spacing.xs },
    // Other cards
    pendingCard: { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderLeftWidth: 4, borderLeftColor: colors.warning },
    pendingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    pendingTitle: { fontSize: typography.h4, fontWeight: typography.semiBold, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
    pendingBadge: { backgroundColor: colors.warning, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.round, minWidth: 28, alignItems: 'center' },
    pendingBadgeText: { color: colors.textOnPrimary, fontSize: typography.caption, fontWeight: typography.bold },
    pendingSubtitle: { fontSize: typography.bodySmall, color: colors.textSecondary },
    quickActions: { flexDirection: 'row', gap: spacing.md },
    quickButton: { flex: 1, borderRadius: borderRadius.md },
    navCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginTop: spacing.md },
    navCardContent: { flexDirection: 'row', alignItems: 'center' },
    navCardText: { flex: 1, marginLeft: spacing.md },
    navCardTitle: { fontSize: typography.body, fontWeight: typography.semiBold, color: colors.textPrimary },
    navCardSubtitle: { fontSize: typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});

export default DashboardScreen;
