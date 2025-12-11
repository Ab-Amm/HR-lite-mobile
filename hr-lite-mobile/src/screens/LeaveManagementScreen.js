import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, spacing, shadows, typography, borderRadius } from '../theme/theme';

const LeaveManagementScreen = ({ navigation }) => {
    const { pendingLeaves, loading, fetchPendingLeaves, approveLeave, rejectLeave } = useApp();
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    useFocusEffect(useCallback(() => { fetchPendingLeaves(); }, [fetchPendingLeaves]));

    const onRefresh = useCallback(async () => { setRefreshing(true); await fetchPendingLeaves(); setRefreshing(false); }, [fetchPendingLeaves]);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const calcDays = (s, e) => Math.ceil(Math.abs(new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1;
    const getLeaveInfo = (t) => ({ PAID: { label: 'Paid Leave', icon: 'beach', color: colors.success }, SICK: { label: 'Sick Leave', icon: 'hospital-box', color: colors.error }, UNPAID: { label: 'Unpaid Leave', icon: 'calendar-remove', color: colors.warning } }[t] || { label: t, icon: 'calendar', color: colors.textSecondary });

    const handleApprove = async (id) => { Alert.alert('Approve Leave', 'Approve this leave request?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Approve', onPress: async () => { setProcessingId(id); try { await approveLeave(id); Alert.alert('Success', 'Leave approved'); } catch (e) { Alert.alert('Error', 'Failed to approve'); } finally { setProcessingId(null); } } }]); };
    const handleReject = async (id) => { Alert.alert('Reject Leave', 'Reject this leave request?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Reject', style: 'destructive', onPress: async () => { setProcessingId(id); try { await rejectLeave(id); Alert.alert('Success', 'Leave rejected'); } catch (e) { Alert.alert('Error', 'Failed to reject'); } finally { setProcessingId(null); } } }]); };

    const LeaveCard = ({ leave }) => {
        const info = getLeaveInfo(leave.type);
        const days = calcDays(leave.startDate, leave.endDate);
        const isProcessing = processingId === leave.id;
        return (
            <Card style={[styles.leaveCard, shadows.medium]}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <Text style={styles.employeeName}>{leave.employeeName || 'Unknown'}</Text>
                        <Chip icon={() => <MaterialCommunityIcons name={info.icon} size={14} color={info.color} />} textStyle={{ color: info.color }} style={{ backgroundColor: info.color + '15' }} compact>{info.label}</Chip>
                    </View>
                    <Divider style={styles.divider} />
                    <View style={styles.dateContainer}>
                        <View style={styles.dateItem}><MaterialCommunityIcons name="calendar-start" size={18} color={colors.textSecondary} /><View style={styles.dateText}><Text style={styles.dateLabel}>From</Text><Text style={styles.dateValue}>{formatDate(leave.startDate)}</Text></View></View>
                        <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textLight} />
                        <View style={styles.dateItem}><MaterialCommunityIcons name="calendar-end" size={18} color={colors.textSecondary} /><View style={styles.dateText}><Text style={styles.dateLabel}>To</Text><Text style={styles.dateValue}>{formatDate(leave.endDate)}</Text></View></View>
                    </View>
                    <Chip icon={() => <MaterialCommunityIcons name="clock-outline" size={14} color={colors.primary} />} textStyle={{ color: colors.primary }} style={styles.durationChip}>{days} day{days > 1 ? 's' : ''}</Chip>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                    <Button mode="outlined" onPress={() => handleReject(leave.id)} textColor={colors.error} style={styles.rejectBtn} disabled={isProcessing} icon="close">Reject</Button>
                    <Button mode="contained" onPress={() => handleApprove(leave.id)} style={styles.approveBtn} disabled={isProcessing} icon="check">Approve</Button>
                </Card.Actions>
            </Card>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-check" size={80} color={colors.success} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>No pending leave requests</Text>
        </View>
    );

    if (loading && pendingLeaves.length === 0) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}><Text style={styles.headerTitle}>Pending Requests</Text><View style={styles.countBadge}><Text style={styles.countText}>{pendingLeaves.length}</Text></View></View>
                <Text style={styles.headerSubtitle}>Review and manage leave requests</Text>
            </View>
            <FlatList data={pendingLeaves} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => <LeaveCard leave={item} />} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />} ListEmptyComponent={<EmptyState />} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: { backgroundColor: colors.surface, padding: spacing.md, ...shadows.small },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: typography.h3, fontWeight: typography.bold, color: colors.textPrimary },
    countBadge: { backgroundColor: colors.warning, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.round, marginLeft: spacing.sm, minWidth: 28, alignItems: 'center' },
    countText: { color: colors.textOnPrimary, fontSize: typography.caption, fontWeight: typography.bold },
    headerSubtitle: { fontSize: typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
    leaveCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.warning },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    employeeName: { fontSize: typography.body, fontWeight: typography.semiBold, color: colors.textPrimary, flex: 1 },
    divider: { marginVertical: spacing.md },
    dateContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    dateText: { marginLeft: spacing.sm },
    dateLabel: { fontSize: typography.caption, color: colors.textSecondary },
    dateValue: { fontSize: typography.bodySmall, fontWeight: typography.medium, color: colors.textPrimary },
    durationChip: { backgroundColor: colors.primary + '15', marginTop: spacing.md, alignSelf: 'flex-start' },
    cardActions: { padding: spacing.sm, paddingTop: 0 },
    rejectBtn: { flex: 1, marginRight: spacing.xs, borderColor: colors.error },
    approveBtn: { flex: 1, marginLeft: spacing.xs, backgroundColor: colors.success },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxl * 2 },
    emptyTitle: { fontSize: typography.h3, fontWeight: typography.semiBold, color: colors.textPrimary, marginTop: spacing.md },
    emptySubtitle: { fontSize: typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});

export default LeaveManagementScreen;
