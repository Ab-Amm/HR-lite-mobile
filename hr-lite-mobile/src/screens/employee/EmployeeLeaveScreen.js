import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Surface, ActivityIndicator, Divider, Chip, FAB, SegmentedButtons, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { leaveApi } from '../../api/api';
import { colors, spacing, shadows, typography, borderRadius } from '../../theme/theme';

const EmployeeLeaveScreen = () => {
    const { currentEmployee } = useApp();
    const [leaves, setLeaves] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    
    // Form State
    const [leaveType, setLeaveType] = useState('PAID');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchLeaves = useCallback(async (showLoading = true) => {
        if (!currentEmployee?.id) return;
        try {
            if (showLoading && !dataLoaded) setInitialLoading(true);
            const response = await leaveApi.getByEmployeeId(currentEmployee.id);
            setLeaves(response.data || []);
            setDataLoaded(true);
        } catch (err) {
            console.error('Leave fetch error:', err);
        } finally {
            setInitialLoading(false);
        }
    }, [currentEmployee?.id, dataLoaded]);

    useFocusEffect(
        useCallback(() => {
            fetchLeaves();
        }, [fetchLeaves])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLeaves(false);
        setRefreshing(false);
    };

    const handleSubmit = async () => {
        if (endDate < startDate) {
            Alert.alert('Error', 'End date cannot be before start date');
            return;
        }
        try {
            setSubmitting(true);
            const leaveData = {
                type: leaveType,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            };
            await leaveApi.create(currentEmployee.id, leaveData);
            Alert.alert('Success', 'Leave request submitted successfully!');
            setModalVisible(false);
            resetForm();
            fetchLeaves();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to submit leave request');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setLeaveType('PAID');
        setStartDate(new Date());
        setEndDate(new Date());
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatDateLong = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const calculateDays = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'APPROVED':
                return { color: colors.success, icon: 'check-circle', label: 'Approved' };
            case 'REJECTED':
                return { color: colors.error, icon: 'close-circle', label: 'Rejected' };
            case 'PENDING':
            default:
                return { color: colors.warning, icon: 'clock-outline', label: 'Pending' };
        }
    };

    const getLeaveTypeConfig = (type) => {
        switch (type) {
            case 'SICK':
                return { color: colors.error, icon: 'medical-bag', label: 'Sick Leave' };
            case 'UNPAID':
                return { color: colors.textSecondary, icon: 'cash-remove', label: 'Unpaid Leave' };
            case 'PAID':
            default:
                return { color: colors.success, icon: 'cash-check', label: 'Paid Leave' };
        }
    };

    // Stats calculation
    const totalRequests = leaves.length;
    const pendingRequests = leaves.filter(l => l.status === 'PENDING').length;
    const approvedRequests = leaves.filter(l => l.status === 'APPROVED').length;
    const totalDaysOff = leaves
        .filter(l => l.status === 'APPROVED')
        .reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);

    if (initialLoading && !dataLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading leaves...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <Surface style={[styles.statCard, shadows.small]} elevation={2}>
                        <MaterialCommunityIcons name="calendar-multiple" size={24} color={colors.primary} />
                        <Text style={styles.statValue}>{totalRequests}</Text>
                        <Text style={styles.statLabel}>Total Requests</Text>
                    </Surface>
                    <Surface style={[styles.statCard, shadows.small]} elevation={2}>
                        <MaterialCommunityIcons name="clock-outline" size={24} color={colors.warning} />
                        <Text style={styles.statValue}>{pendingRequests}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </Surface>
                    <Surface style={[styles.statCard, shadows.small]} elevation={2}>
                        <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                        <Text style={styles.statValue}>{approvedRequests}</Text>
                        <Text style={styles.statLabel}>Approved</Text>
                    </Surface>
                    <Surface style={[styles.statCard, shadows.small]} elevation={2}>
                        <MaterialCommunityIcons name="beach" size={24} color={colors.info} />
                        <Text style={styles.statValue}>{totalDaysOff}</Text>
                        <Text style={styles.statLabel}>Days Off</Text>
                    </Surface>
                </View>

                {/* Leave Requests */}
                <Card style={[styles.listCard, shadows.small]}>
                    <Card.Content>
                        <View style={styles.listHeader}>
                            <MaterialCommunityIcons name="format-list-bulleted" size={24} color={colors.primary} />
                            <Text style={styles.listTitle}>My Leave Requests</Text>
                        </View>
                        <Divider style={styles.divider} />

                        {leaves.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="calendar-blank-outline" size={64} color={colors.textLight} />
                                <Text style={styles.emptyTitle}>No Leave Requests</Text>
                                <Text style={styles.emptyText}>Tap the + button to request time off</Text>
                            </View>
                        ) : (
                            leaves.map((leave, index) => {
                                const statusConfig = getStatusConfig(leave.status);
                                const typeConfig = getLeaveTypeConfig(leave.type);
                                const days = calculateDays(leave.startDate, leave.endDate);

                                return (
                                    <Surface key={leave.id || index} style={[styles.leaveItem, shadows.small]} elevation={1}>
                                        <View style={styles.leaveHeader}>
                                            <View style={styles.leaveTypeContainer}>
                                                <MaterialCommunityIcons name={typeConfig.icon} size={20} color={typeConfig.color} />
                                                <Text style={[styles.leaveType, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                                            </View>
                                            <Chip
                                                icon={() => <MaterialCommunityIcons name={statusConfig.icon} size={14} color={statusConfig.color} />}
                                                style={[styles.statusChip, { backgroundColor: statusConfig.color + '20' }]}
                                                textStyle={{ color: statusConfig.color, fontSize: 12 }}
                                            >
                                                {statusConfig.label}
                                            </Chip>
                                        </View>
                                        <View style={styles.leaveDates}>
                                            <View style={styles.dateRange}>
                                                <MaterialCommunityIcons name="calendar-range" size={18} color={colors.textSecondary} />
                                                <Text style={styles.dateText}>
                                                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                                </Text>
                                            </View>
                                            <View style={styles.durationBadge}>
                                                <Text style={styles.durationText}>{days} day{days > 1 ? 's' : ''}</Text>
                                            </View>
                                        </View>
                                    </Surface>
                                );
                            })
                        )}
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* FAB for new request */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setModalVisible(true)}
                color={colors.textOnPrimary}
            />

            {/* Request Modal */}
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.modalHeader}>
                            <MaterialCommunityIcons name="calendar-plus" size={40} color={colors.primary} />
                            <Text style={styles.modalTitle}>New Leave Request</Text>
                        </View>

                        {/* Leave Type Selection */}
                        <Text style={styles.fieldLabel}>Leave Type</Text>
                        <SegmentedButtons
                            value={leaveType}
                            onValueChange={setLeaveType}
                            buttons={[
                                { value: 'PAID', label: 'Paid', icon: 'cash-check' },
                                { value: 'SICK', label: 'Sick', icon: 'medical-bag' },
                                { value: 'UNPAID', label: 'Unpaid', icon: 'cash-remove' },
                            ]}
                            style={styles.segmented}
                        />

                        {/* Date Selection */}
                        <Text style={styles.fieldLabel}>Start Date</Text>
                        <Button
                            mode="outlined"
                            onPress={() => setShowStartPicker(true)}
                            icon="calendar-start"
                            style={styles.dateButton}
                            contentStyle={styles.dateButtonContent}
                        >
                            {formatDateLong(startDate)}
                        </Button>
                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                onChange={(e, date) => {
                                    setShowStartPicker(false);
                                    if (date) {
                                        setStartDate(date);
                                        if (date > endDate) setEndDate(date);
                                    }
                                }}
                                minimumDate={new Date()}
                            />
                        )}

                        <Text style={styles.fieldLabel}>End Date</Text>
                        <Button
                            mode="outlined"
                            onPress={() => setShowEndPicker(true)}
                            icon="calendar-end"
                            style={styles.dateButton}
                            contentStyle={styles.dateButtonContent}
                        >
                            {formatDateLong(endDate)}
                        </Button>
                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="default"
                                onChange={(e, date) => {
                                    setShowEndPicker(false);
                                    if (date) setEndDate(date);
                                }}
                                minimumDate={startDate}
                            />
                        )}

                        {/* Duration Summary */}
                        <Surface style={styles.durationSummary} elevation={1}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                            <Text style={styles.durationSummaryText}>
                                Duration: <Text style={styles.durationSummaryValue}>
                                    {calculateDays(startDate, endDate)} day{calculateDays(startDate, endDate) > 1 ? 's' : ''}
                                </Text>
                            </Text>
                        </Surface>

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <Button
                                mode="outlined"
                                onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                                style={styles.cancelButton}
                                textColor={colors.textSecondary}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                loading={submitting}
                                disabled={submitting}
                                style={styles.submitButton}
                                icon="send"
                            >
                                Submit Request
                            </Button>
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.md,
        paddingBottom: 100,
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs,
        marginBottom: spacing.md,
    },
    statCard: {
        width: '48%',
        margin: '1%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
    },
    statValue: {
        fontSize: typography.h2,
        fontWeight: typography.bold,
        color: colors.textPrimary,
        marginTop: spacing.sm,
    },
    statLabel: {
        fontSize: typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    listCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listTitle: {
        fontSize: typography.h4,
        fontWeight: typography.semiBold,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    divider: {
        marginVertical: spacing.md,
        backgroundColor: colors.border,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyTitle: {
        fontSize: typography.h4,
        fontWeight: typography.semiBold,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    emptyText: {
        fontSize: typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    leaveItem: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    leaveHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    leaveTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leaveType: {
        fontSize: typography.body,
        fontWeight: typography.semiBold,
        marginLeft: spacing.sm,
    },
    statusChip: {
        height: 28,
    },
    leaveDates: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateRange: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: typography.bodySmall,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    durationBadge: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
    },
    durationText: {
        fontSize: typography.caption,
        color: colors.primary,
        fontWeight: typography.semiBold,
    },
    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.lg,
        backgroundColor: colors.primary,
    },
    modalContainer: {
        backgroundColor: colors.surface,
        margin: spacing.lg,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        maxHeight: '85%',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: typography.h3,
        fontWeight: typography.bold,
        color: colors.textPrimary,
        marginTop: spacing.sm,
    },
    fieldLabel: {
        fontSize: typography.body,
        fontWeight: typography.semiBold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    segmented: {
        marginBottom: spacing.sm,
    },
    dateButton: {
        borderColor: colors.border,
        borderRadius: borderRadius.md,
    },
    dateButtonContent: {
        paddingVertical: spacing.sm,
    },
    durationSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary + '10',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.lg,
    },
    durationSummaryText: {
        fontSize: typography.body,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    durationSummaryValue: {
        fontWeight: typography.bold,
        color: colors.primary,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xl,
    },
    cancelButton: {
        flex: 1,
        marginRight: spacing.sm,
        borderColor: colors.border,
    },
    submitButton: {
        flex: 1.5,
        marginLeft: spacing.sm,
    },
});

export default EmployeeLeaveScreen;
