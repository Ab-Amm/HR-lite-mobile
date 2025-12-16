import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Surface, ActivityIndicator, Divider, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { attendanceApi } from '../../api/api';
import { colors, spacing, shadows, typography, borderRadius } from '../../theme/theme';

const EmployeeAttendanceScreen = () => {
    const { currentEmployee } = useApp();
    const [attendance, setAttendance] = useState(null);
    const [history, setHistory] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [dataLoaded, setDataLoaded] = useState(false);

    const fetchAttendanceData = useCallback(async (showLoading = true) => {
        if (!currentEmployee?.id) return;
        try {
            if (showLoading && !dataLoaded) setInitialLoading(true);
            const [todayRes, historyRes] = await Promise.all([
                attendanceApi.getToday(currentEmployee.id),
                attendanceApi.getHistory(currentEmployee.id)
            ]);
            setAttendance(todayRes.data);
            setHistory(historyRes.data || []);
            setDataLoaded(true);
        } catch (err) {
            console.error('Attendance fetch error:', err);
        } finally {
            setInitialLoading(false);
        }
    }, [currentEmployee?.id, dataLoaded]);

    useFocusEffect(
        useCallback(() => {
            fetchAttendanceData();
        }, [fetchAttendanceData])
    );

    // Timer for elapsed time when checked in
    useEffect(() => {
        let interval;
        if (attendance?.checkInTime && !attendance?.checkOutTime) {
            const calculateElapsed = () => {
                const checkIn = new Date(attendance.checkInTime);
                const now = new Date();
                const diffMs = now - checkIn;
                setElapsedTime(Math.floor(diffMs / 1000));
            };
            calculateElapsed();
            interval = setInterval(calculateElapsed, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [attendance]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAttendanceData(false);
        setRefreshing(false);
    };

    const handleCheckIn = async () => {
        try {
            setActionLoading(true);
            const response = await attendanceApi.checkIn(currentEmployee.id);
            setAttendance(response.data);
            Alert.alert('✅ Checked In', 'Good morning! Have a productive day!');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to check in');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        Alert.alert(
            'Confirm Check Out',
            'Are you sure you want to check out for today?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Check Out',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            const response = await attendanceApi.checkOut(currentEmployee.id);
                            setAttendance(response.data);
                            Alert.alert('👋 Checked Out', 'Great work today! See you tomorrow!');
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.error || 'Failed to check out');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '--:--';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatElapsedTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatWorkedTime = (minutes) => {
        if (!minutes) return '0h 0m';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h ${mins}m`;
    };

    const getWorkProgress = (minutes) => {
        const targetMinutes = 8 * 60; // 8 hours
        return Math.min((minutes || 0) / targetMinutes, 1);
    };

    const calculateWeeklyHours = () => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekRecords = history.filter(record => new Date(record.date) >= oneWeekAgo);
        const totalMinutes = weekRecords.reduce((sum, record) => sum + (record.workedMinutes || 0), 0);
        return formatWorkedTime(totalMinutes);
    };

    const calculateMonthlyHours = () => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const monthRecords = history.filter(record => new Date(record.date) >= oneMonthAgo);
        const totalMinutes = monthRecords.reduce((sum, record) => sum + (record.workedMinutes || 0), 0);
        return formatWorkedTime(totalMinutes);
    };

    const getStatusInfo = () => {
        if (!attendance) return { status: 'not-started', label: 'Not Checked In', color: colors.textSecondary, icon: 'clock-outline' };
        if (attendance.checkInTime && !attendance.checkOutTime) return { status: 'working', label: 'Working', color: colors.success, icon: 'briefcase-clock' };
        if (attendance.checkInTime && attendance.checkOutTime) return { status: 'completed', label: 'Completed', color: colors.info, icon: 'check-circle' };
        return { status: 'not-started', label: 'Not Checked In', color: colors.textSecondary, icon: 'clock-outline' };
    };

    if (initialLoading && !dataLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading attendance...</Text>
            </View>
        );
    }

    const statusInfo = getStatusInfo();
    const isWorking = statusInfo.status === 'working';
    const isCompleted = statusInfo.status === 'completed';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            {/* Today's Status Card */}
            <Surface style={[styles.statusCard, shadows.medium]} elevation={3}>
                <View style={styles.statusHeader}>
                    <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                        <MaterialCommunityIcons name={statusInfo.icon} size={16} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                </View>

                {/* Timer Display */}
                {isWorking && (
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerLabel}>Time Worked Today</Text>
                        <Text style={styles.timerValue}>{formatElapsedTime(elapsedTime)}</Text>
                        <View style={styles.progressContainer}>
                            <ProgressBar
                                progress={getWorkProgress(elapsedTime / 60)}
                                color={colors.primary}
                                style={styles.progressBar}
                            />
                            <Text style={styles.progressText}>{Math.round(getWorkProgress(elapsedTime / 60) * 100)}% of 8h target</Text>
                        </View>
                    </View>
                )}

                {/* Completed Time */}
                {isCompleted && (
                    <View style={styles.completedContainer}>
                        <MaterialCommunityIcons name="check-decagram" size={48} color={colors.success} />
                        <Text style={styles.completedText}>Day Complete!</Text>
                        <Text style={styles.workedText}>Total: {formatWorkedTime(attendance?.workedMinutes)}</Text>
                    </View>
                )}

                {/* Time Details */}
                <View style={styles.timeRow}>
                    <View style={styles.timeBlock}>
                        <MaterialCommunityIcons name="login" size={24} color={colors.success} />
                        <Text style={styles.timeLabel}>Check In</Text>
                        <Text style={styles.timeValue}>{formatTime(attendance?.checkInTime)}</Text>
                    </View>
                    <View style={styles.timeDivider} />
                    <View style={styles.timeBlock}>
                        <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
                        <Text style={styles.timeLabel}>Check Out</Text>
                        <Text style={styles.timeValue}>{formatTime(attendance?.checkOutTime)}</Text>
                    </View>
                </View>

                {/* Action Button */}
                {!isCompleted && (
                    <Button
                        mode="contained"
                        onPress={attendance?.checkInTime ? handleCheckOut : handleCheckIn}
                        loading={actionLoading}
                        disabled={actionLoading}
                        style={[styles.actionButton, { backgroundColor: attendance?.checkInTime ? colors.error : colors.success }]}
                        contentStyle={styles.actionButtonContent}
                        icon={attendance?.checkInTime ? 'logout' : 'login'}
                    >
                        {attendance?.checkInTime ? 'Check Out' : 'Check In'}
                    </Button>
                )}
            </Surface>

            {/* Weekly & Monthly Stats */}
            <View style={styles.statsRow}>
                <Card style={[styles.statCard, shadows.small]}>
                    <Card.Content style={styles.statContent}>
                        <MaterialCommunityIcons name="calendar-week" size={28} color={colors.info} />
                        <Text style={styles.statValue}>{calculateWeeklyHours()}</Text>
                        <Text style={styles.statLabel}>This Week</Text>
                    </Card.Content>
                </Card>
                <Card style={[styles.statCard, shadows.small]}>
                    <Card.Content style={styles.statContent}>
                        <MaterialCommunityIcons name="calendar-month" size={28} color={colors.warning} />
                        <Text style={styles.statValue}>{calculateMonthlyHours()}</Text>
                        <Text style={styles.statLabel}>This Month</Text>
                    </Card.Content>
                </Card>
            </View>

            {/* Attendance History */}
            <Card style={[styles.historyCard, shadows.small]}>
                <Card.Content>
                    <View style={styles.historyHeader}>
                        <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
                        <Text style={styles.historyTitle}>Recent History</Text>
                    </View>
                    <Divider style={styles.divider} />
                    
                    {history.length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <MaterialCommunityIcons name="calendar-blank" size={48} color={colors.textLight} />
                            <Text style={styles.emptyText}>No attendance history yet</Text>
                        </View>
                    ) : (
                        history.slice(0, 10).map((record, index) => (
                            <View key={record.id || index} style={styles.historyItem}>
                                <View style={styles.historyDate}>
                                    <Text style={styles.historyDateText}>{formatDate(record.date)}</Text>
                                </View>
                                <View style={styles.historyTimes}>
                                    <View style={styles.historyTimeItem}>
                                        <MaterialCommunityIcons name="login" size={16} color={colors.success} />
                                        <Text style={styles.historyTimeText}>{formatTime(record.checkInTime)}</Text>
                                    </View>
                                    <View style={styles.historyTimeItem}>
                                        <MaterialCommunityIcons name="logout" size={16} color={colors.error} />
                                        <Text style={styles.historyTimeText}>{formatTime(record.checkOutTime)}</Text>
                                    </View>
                                </View>
                                <View style={styles.historyHours}>
                                    <Text style={styles.historyHoursText}>{formatWorkedTime(record.workedMinutes)}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.body,
        color: colors.textSecondary,
    },
    statusCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    dateText: {
        fontSize: typography.body,
        color: colors.textSecondary,
        fontWeight: typography.medium,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
    },
    statusText: {
        fontSize: typography.caption,
        fontWeight: typography.semiBold,
        marginLeft: spacing.xs,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    timerLabel: {
        fontSize: typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    timerValue: {
        fontSize: 48,
        fontWeight: typography.bold,
        color: colors.primary,
        fontFamily: 'monospace',
    },
    progressContainer: {
        width: '100%',
        marginTop: spacing.md,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.border,
    },
    progressText: {
        fontSize: typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    completedContainer: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    completedText: {
        fontSize: typography.h3,
        fontWeight: typography.bold,
        color: colors.success,
        marginTop: spacing.sm,
    },
    workedText: {
        fontSize: typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: spacing.md,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    timeBlock: {
        alignItems: 'center',
        flex: 1,
    },
    timeDivider: {
        width: 1,
        height: 50,
        backgroundColor: colors.border,
    },
    timeLabel: {
        fontSize: typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    timeValue: {
        fontSize: typography.h3,
        fontWeight: typography.bold,
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    actionButton: {
        borderRadius: borderRadius.lg,
    },
    actionButtonContent: {
        paddingVertical: spacing.sm,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    statCard: {
        flex: 1,
        marginHorizontal: spacing.xs,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    statValue: {
        fontSize: typography.h3,
        fontWeight: typography.bold,
        color: colors.textPrimary,
        marginTop: spacing.sm,
    },
    statLabel: {
        fontSize: typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    historyCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyTitle: {
        fontSize: typography.h4,
        fontWeight: typography.semiBold,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    divider: {
        marginVertical: spacing.md,
        backgroundColor: colors.border,
    },
    emptyHistory: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyText: {
        fontSize: typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    historyDate: {
        flex: 1,
    },
    historyDateText: {
        fontSize: typography.bodySmall,
        color: colors.textPrimary,
        fontWeight: typography.medium,
    },
    historyTimes: {
        flex: 1.5,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    historyTimeItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyTimeText: {
        fontSize: typography.bodySmall,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
    },
    historyHours: {
        flex: 0.8,
        alignItems: 'flex-end',
    },
    historyHoursText: {
        fontSize: typography.bodySmall,
        fontWeight: typography.semiBold,
        color: colors.primary,
    },
});

export default EmployeeAttendanceScreen;
