import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { colors, spacing, shadows, typography, borderRadius } from '../theme/theme';

const CreateLeaveScreen = ({ navigation }) => {
    const { employees, loading, fetchEmployees, createLeaveRequest } = useApp();
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [leaveType, setLeaveType] = useState('PAID');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showList, setShowList] = useState(false);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const formatApi = (d) => d.toISOString().split('T')[0];
    const calcDays = () => Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const handleSubmit = async () => {
        if (!selectedEmployee) { Alert.alert('Error', 'Please select an employee'); return; }
        if (endDate < startDate) { Alert.alert('Error', 'End date cannot be before start date'); return; }
        try {
            setSubmitting(true);
            await createLeaveRequest(selectedEmployee.id, { type: leaveType, startDate: formatApi(startDate), endDate: formatApi(endDate) });
            Alert.alert('Success', 'Leave request submitted', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (e) { Alert.alert('Error', 'Failed to submit'); } finally { setSubmitting(false); }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.header}><MaterialCommunityIcons name="calendar-plus" size={48} color={colors.primary} /><Text style={styles.headerTitle}>New Leave Request</Text></View>

                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Select Employee</Text>
                        {selectedEmployee ? (
                            <View style={styles.selectedEmp}><View><Text style={styles.empName}>{selectedEmployee.fullName}</Text><Text style={styles.empPos}>{selectedEmployee.position}</Text></View><Button mode="text" onPress={() => setShowList(!showList)}>Change</Button></View>
                        ) : <Button mode="outlined" onPress={() => setShowList(!showList)} icon="account-search">Choose Employee</Button>}
                        {showList && employees.map((e) => (
                            <Card key={e.id} style={[styles.empCard, selectedEmployee?.id === e.id && styles.selectedCard]} onPress={() => { setSelectedEmployee(e); setShowList(false); }}>
                                <Card.Content style={styles.empCardContent}><View><Text style={styles.empCardName}>{e.fullName}</Text><Text style={styles.empCardPos}>{e.position}</Text></View>{selectedEmployee?.id === e.id && <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />}</Card.Content>
                            </Card>
                        ))}
                    </Card.Content>
                </Card>

                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Leave Type</Text>
                        <SegmentedButtons value={leaveType} onValueChange={setLeaveType} buttons={[{ value: 'PAID', label: 'Paid' }, { value: 'SICK', label: 'Sick' }, { value: 'UNPAID', label: 'Unpaid' }]} style={styles.segmented} />
                    </Card.Content>
                </Card>

                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Date Range</Text>
                        <View style={styles.dateRow}><View style={styles.dateLabel}><MaterialCommunityIcons name="calendar-start" size={20} color={colors.textSecondary} /><Text style={styles.dateLabelText}>Start</Text></View><Button mode="outlined" onPress={() => setShowStartPicker(true)}>{formatDate(startDate)}</Button></View>
                        {showStartPicker && <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { setShowStartPicker(Platform.OS === 'ios'); if (d) { setStartDate(d); if (d > endDate) setEndDate(d); } }} minimumDate={new Date()} />}
                        <View style={[styles.dateRow, { marginTop: spacing.md }]}><View style={styles.dateLabel}><MaterialCommunityIcons name="calendar-end" size={20} color={colors.textSecondary} /><Text style={styles.dateLabelText}>End</Text></View><Button mode="outlined" onPress={() => setShowEndPicker(true)}>{formatDate(endDate)}</Button></View>
                        {showEndPicker && <DateTimePicker value={endDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { setShowEndPicker(Platform.OS === 'ios'); if (d) setEndDate(d); }} minimumDate={startDate} />}
                        <View style={styles.duration}><MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} /><Text style={styles.durationText}>Duration: <Text style={styles.durationValue}>{calcDays()} day{calcDays() > 1 ? 's' : ''}</Text></Text></View>
                    </Card.Content>
                </Card>

                <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting || !selectedEmployee} style={styles.submitBtn} icon="send">Submit Request</Button>
                <Button mode="text" onPress={() => navigation.goBack()} textColor={colors.textSecondary}>Cancel</Button>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.md },
    headerTitle: { fontSize: typography.h2, fontWeight: typography.bold, color: colors.textPrimary, marginTop: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    sectionTitle: { fontSize: typography.h4, fontWeight: typography.semiBold, color: colors.textPrimary, marginBottom: spacing.md },
    selectedEmp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primary + '10', padding: spacing.md, borderRadius: borderRadius.md },
    empName: { fontSize: typography.body, fontWeight: typography.semiBold, color: colors.textPrimary },
    empPos: { fontSize: typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    empCard: { backgroundColor: colors.background, marginTop: spacing.sm },
    selectedCard: { borderWidth: 2, borderColor: colors.primary },
    empCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    empCardName: { fontSize: typography.body, fontWeight: typography.medium, color: colors.textPrimary },
    empCardPos: { fontSize: typography.caption, color: colors.textSecondary },
    segmented: { marginBottom: spacing.md },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateLabel: { flexDirection: 'row', alignItems: 'center' },
    dateLabelText: { fontSize: typography.body, color: colors.textSecondary, marginLeft: spacing.sm },
    duration: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.primary + '10', borderRadius: borderRadius.md },
    durationText: { fontSize: typography.body, color: colors.textSecondary, marginLeft: spacing.sm },
    durationValue: { fontWeight: typography.bold, color: colors.primary },
    submitBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: borderRadius.md },
});

export default CreateLeaveScreen;
