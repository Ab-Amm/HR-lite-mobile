import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Avatar, Chip, Divider, ActivityIndicator, Button, IconButton, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { attendanceApi } from '../api/api';
import { colors, spacing, shadows, typography, borderRadius } from '../theme/theme';

const EmployeeDetailScreen = ({ route, navigation }) => {
    const { employeeId } = route.params;
    const { selectedEmployee, contracts, leaveRequests, loading, fetchEmployeeById, fetchContractsByEmployee, fetchLeavesByEmployee, deleteEmployee } = useApp();
    const [activeTab, setActiveTab] = useState(0);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const tabs = ['Profile', 'Contracts', 'Leaves', 'Attendance'];

    const loadData = useCallback(async () => {
        await Promise.all([fetchEmployeeById(employeeId), fetchContractsByEmployee(employeeId), fetchLeavesByEmployee(employeeId)]);
        try {
            const res = await attendanceApi.getHistory(employeeId);
            setAttendanceHistory(res.data);
        } catch (e) {
            console.error("Failed to fetch attendance", e);
        }
    }, [employeeId, fetchEmployeeById, fetchContractsByEmployee, fetchLeavesByEmployee]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    // Set edit button in header
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <IconButton
                    icon="pencil"
                    iconColor={colors.textOnPrimary}
                    size={24}
                    onPress={() => navigation.navigate('EditEmployee', { employeeId })}
                />
            ),
        });
    }, [navigation, employeeId]);

    const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

    const handleDelete = () => {
        Alert.alert(
            'Delete Employee',
            `Are you sure you want to delete ${selectedEmployee?.fullName}? This will also delete all their contracts and leave requests.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            await deleteEmployee(employeeId);
                            Alert.alert('Success', 'Employee deleted', [
                                { text: 'OK', onPress: () => navigation.navigate('Main') }
                            ]);
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete employee');
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const getInitials = (name) => name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '??';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Present';
    const formatSalary = (s) => s ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s) : '$0';
    const getContractStyle = (t) => ({ CDI: { label: 'Permanent', color: colors.success }, CDD: { label: 'Fixed Term', color: colors.warning }, INTERNSHIP: { label: 'Internship', color: colors.info } }[t] || { label: t, color: colors.textSecondary });
    const getStatusStyle = (s) => ({ APPROVED: { color: colors.success, icon: 'check-circle' }, PENDING: { color: colors.warning, icon: 'clock-outline' }, REJECTED: { color: colors.error, icon: 'close-circle' } }[s] || { color: colors.textSecondary, icon: 'help-circle' });
    const getLeaveLabel = (t) => ({ PAID: 'Paid Leave', SICK: 'Sick Leave', UNPAID: 'Unpaid Leave' }[t] || t);

    const ProfileTab = () => (
        <View style={styles.tabContent}>
            <Card style={[styles.infoCard, shadows.small]}>
                <Card.Content>
                    <Text style={styles.infoCardTitle}>Contact Information</Text>
                    <Divider style={styles.divider} />
                    <View style={styles.infoRow}><MaterialCommunityIcons name="email-outline" size={20} color={colors.textSecondary} /><View style={styles.infoTextContainer}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{selectedEmployee?.email}</Text></View></View>
                    <View style={styles.infoRow}><MaterialCommunityIcons name="phone-outline" size={20} color={colors.textSecondary} /><View style={styles.infoTextContainer}><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{selectedEmployee?.phoneNumber || 'Not provided'}</Text></View></View>
                </Card.Content>
            </Card>
            <Card style={[styles.infoCard, shadows.small]}>
                <Card.Content>
                    <Text style={styles.infoCardTitle}>Employment Details</Text>
                    <Divider style={styles.divider} />
                    <View style={styles.infoRow}><MaterialCommunityIcons name="briefcase-outline" size={20} color={colors.textSecondary} /><View style={styles.infoTextContainer}><Text style={styles.infoLabel}>Position</Text><Text style={styles.infoValue}>{selectedEmployee?.position}</Text></View></View>
                    <View style={styles.infoRow}><MaterialCommunityIcons name="currency-usd" size={20} color={colors.textSecondary} /><View style={styles.infoTextContainer}><Text style={styles.infoLabel}>Current Salary</Text><Text style={[styles.infoValue, { color: colors.success }]}>{formatSalary(selectedEmployee?.currentSalary)}</Text></View></View>
                    <View style={styles.infoRow}><MaterialCommunityIcons name="calendar-start" size={20} color={colors.textSecondary} /><View style={styles.infoTextContainer}><Text style={styles.infoLabel}>Join Date</Text><Text style={styles.infoValue}>{formatDate(selectedEmployee?.joinDate)}</Text></View></View>
                </Card.Content>
            </Card>

            {/* Delete Button */}
            <Button
                mode="outlined"
                onPress={handleDelete}
                loading={deleting}
                disabled={deleting}
                style={styles.deleteButton}
                textColor={colors.error}
                icon="delete"
            >
                Delete Employee
            </Button>
        </View>
    );

    const ContractsTab = () => (
        <View style={styles.tabContent}>
            {contracts.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="file-document-outline" size={60} color={colors.textLight} />
                    <Text style={styles.emptyText}>No contracts yet</Text>
                    <Button mode="contained" onPress={() => navigation.navigate('AddContract', { employeeId, employeeName: selectedEmployee?.fullName })} style={{ marginTop: spacing.md }}>
                        Add First Contract
                    </Button>
                </View>
            ) : (
                contracts.map((c) => {
                    const ts = getContractStyle(c.type);
                    const isActive = c.isActive;
                    return (
                        <Card key={c.id} style={[styles.contractCard, shadows.small, !isActive && styles.inactiveCard]}>
                            <Card.Content>
                                <View style={styles.contractHeader}>
                                    <Chip textStyle={{ color: ts.color }} style={{ backgroundColor: ts.color + '20' }}>{ts.label}</Chip>
                                    {isActive ? (
                                        <Chip
                                            icon={() => <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />}
                                            textStyle={{ color: colors.success }}
                                            style={{ backgroundColor: colors.success + '15', marginLeft: 8 }}
                                        >
                                            Active
                                        </Chip>
                                    ) : (
                                        <Chip textStyle={{ color: colors.textLight }} style={{ backgroundColor: colors.border, marginLeft: 8 }}>
                                            Inactive
                                        </Chip>
                                    )}
                                </View>
                                <View style={styles.contractRow}>
                                    <Text style={[styles.contractLabel, !isActive && styles.dimmedText]}>Period</Text>
                                    <Text style={[styles.contractValue, !isActive && styles.dimmedText]}>{formatDate(c.startDate)} - {formatDate(c.endDate)}</Text>
                                </View>
                                <View style={styles.contractRow}>
                                    <Text style={[styles.contractLabel, !isActive && styles.dimmedText]}>Salary</Text>
                                    <Text style={[styles.contractValue, isActive ? { color: colors.success } : styles.dimmedText]}>{formatSalary(c.signedSalary)}</Text>
                                </View>
                            </Card.Content>
                        </Card>
                    );
                })
            )}
        </View>
    );

    const LeavesTab = () => (
        <View style={styles.tabContent}>
            {leaveRequests.length === 0 ? <View style={styles.emptyState}><MaterialCommunityIcons name="calendar-blank-outline" size={60} color={colors.textLight} /><Text style={styles.emptyText}>No leave requests</Text></View> :
                leaveRequests.map((l) => {
                    const ss = getStatusStyle(l.status); return (
                        <Card key={l.id} style={[styles.leaveCard, shadows.small]}>
                            <Card.Content>
                                <View style={styles.leaveHeader}>
                                    <View style={styles.leaveTypeContainer}><MaterialCommunityIcons name={l.type === 'SICK' ? 'hospital-box' : 'beach'} size={20} color={colors.primary} /><Text style={styles.leaveType}>{getLeaveLabel(l.type)}</Text></View>
                                    <View style={[styles.statusBadge, { backgroundColor: ss.color + '20' }]}><MaterialCommunityIcons name={ss.icon} size={14} color={ss.color} /><Text style={[styles.statusText, { color: ss.color }]}>{l.status}</Text></View>
                                </View>
                                <Text style={styles.leaveDates}>{formatDate(l.startDate)} - {formatDate(l.endDate)}</Text>
                            </Card.Content>
                        </Card>
                    );
                })
            }
        </View>
    );

    const AttendanceTab = () => {
        const formatTime = (t) => t ? new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const calculateDuration = (start, end) => {
            if (!start || !end) return 'In Progress';
            const diff = new Date(end) - new Date(start);
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        };

        if (!attendanceHistory || attendanceHistory.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="calendar-clock" size={60} color={colors.textLight} />
                    <Text style={styles.emptyText}>No attendance records found</Text>
                </View>
            );
        }

        return (
            <View style={styles.tabContent}>
                {attendanceHistory.map((record) => (
                    <Card key={record.id} style={[styles.infoCard, shadows.small]}>
                        <Card.Content>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                                <Text style={{ fontSize: typography.body, fontWeight: typography.semiBold, color: colors.textPrimary }}>{formatDate(record.date)}</Text>
                                <Chip 
                                    icon={record.checkOutTime ? "check-circle" : "clock-outline"} 
                                    style={{ backgroundColor: record.checkOutTime ? colors.success + '15' : colors.warning + '15' }}
                                    textStyle={{ color: record.checkOutTime ? colors.success : colors.warning }}
                                    compact
                                >
                                    {record.checkOutTime ? 'Completed' : 'Active'}
                                </Chip>
                            </View>
                            <Divider style={styles.divider} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View>
                                    <Text style={styles.infoLabel}>Check In</Text>
                                    <Text style={styles.infoValue}>{formatTime(record.checkInTime)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.infoLabel}>Check Out</Text>
                                    <Text style={styles.infoValue}>{formatTime(record.checkOutTime)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.infoLabel}>Duration</Text>
                                    <Text style={styles.infoValue}>{calculateDuration(record.checkInTime, record.checkOutTime)}</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                ))}
            </View>
        );
    };

    if (loading && !selectedEmployee) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>;
    if (!selectedEmployee) return <View style={styles.errorContainer}><MaterialCommunityIcons name="alert-circle-outline" size={60} color={colors.error} /><Text style={styles.errorText}>Employee not found</Text></View>;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
                <View style={styles.headerCard}>
                    <View style={styles.headerBackground} />
                    <Avatar.Text size={100} label={getInitials(selectedEmployee.fullName)} style={styles.avatar} />
                    <Text style={styles.employeeName}>{selectedEmployee.fullName}</Text>
                    <Text style={styles.employeePosition}>{selectedEmployee.position}</Text>
                </View>
                <View style={styles.tabContainer}>{tabs.map((t, i) => (<View key={t} style={styles.tabItem}><Text style={[styles.tabText, activeTab === i && styles.activeTabText]} onPress={() => setActiveTab(i)}>{t}</Text>{activeTab === i && <View style={styles.activeIndicator} />}</View>))}</View>
                {activeTab === 0 && <ProfileTab />}
                {activeTab === 1 && <ContractsTab />}
                {activeTab === 2 && <LeavesTab />}
                {activeTab === 3 && <AttendanceTab />}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* FAB for Contracts tab */}
            {activeTab === 1 && (
                <FAB
                    icon="plus"
                    style={styles.fab}
                    onPress={() => navigation.navigate('AddContract', { employeeId, employeeName: selectedEmployee?.fullName })}
                    color={colors.textOnPrimary}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    errorText: { marginTop: spacing.md, color: colors.error, fontSize: typography.h4 },
    headerCard: { alignItems: 'center', paddingBottom: spacing.lg, backgroundColor: colors.surface },
    headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, backgroundColor: colors.primary },
    avatar: { marginTop: 50, backgroundColor: colors.primaryLight, borderWidth: 4, borderColor: colors.surface },
    employeeName: { fontSize: typography.h2, fontWeight: typography.bold, color: colors.textPrimary, marginTop: spacing.md },
    employeePosition: { fontSize: typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    tabContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
    tabText: { fontSize: typography.body, color: colors.textSecondary, fontWeight: typography.medium },
    activeTabText: { color: colors.primary, fontWeight: typography.semiBold },
    activeIndicator: { position: 'absolute', bottom: 0, left: spacing.lg, right: spacing.lg, height: 3, backgroundColor: colors.primary, borderRadius: borderRadius.sm },
    tabContent: { padding: spacing.md },
    infoCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    infoCardTitle: { fontSize: typography.h4, fontWeight: typography.semiBold, color: colors.textPrimary, marginBottom: spacing.sm },
    divider: { marginBottom: spacing.md },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
    infoTextContainer: { marginLeft: spacing.md, flex: 1 },
    infoLabel: { fontSize: typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
    infoValue: { fontSize: typography.body, color: colors.textPrimary, fontWeight: typography.medium },
    contractCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    inactiveCard: { opacity: 0.7, backgroundColor: colors.background },
    dimmedText: { color: colors.textLight },
    contractHeader: { flexDirection: 'row', marginBottom: spacing.md },
    contractRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    contractLabel: { fontSize: typography.bodySmall, color: colors.textSecondary },
    contractValue: { fontSize: typography.bodySmall, color: colors.textPrimary, fontWeight: typography.medium },
    leaveCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    leaveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    leaveTypeContainer: { flexDirection: 'row', alignItems: 'center' },
    leaveType: { fontSize: typography.body, fontWeight: typography.semiBold, color: colors.textPrimary, marginLeft: spacing.sm },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.round },
    statusText: { fontSize: typography.caption, fontWeight: typography.semiBold, marginLeft: spacing.xs },
    leaveDates: { fontSize: typography.bodySmall, color: colors.textSecondary },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
    emptyText: { fontSize: typography.body, color: colors.textSecondary, marginTop: spacing.md },
    deleteButton: { marginTop: spacing.lg, borderColor: colors.error, borderWidth: 1.5 },
    fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.primary },
});

export default EmployeeDetailScreen;
