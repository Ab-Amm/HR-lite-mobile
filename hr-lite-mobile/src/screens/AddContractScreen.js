import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { colors, spacing, shadows, typography, borderRadius } from '../theme/theme';
import { contractApi } from '../api/api';

const AddContractScreen = ({ route, navigation }) => {
    const { employeeId, employeeName } = route.params;
    const { fetchContractsByEmployee, fetchEmployeeById } = useApp();

    const [contractType, setContractType] = useState('CDI');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [salary, setSalary] = useState('');
    const [salaryError, setSalaryError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const formatDate = (d) => d ? d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Not set';
    const formatApi = (d) => d ? d.toISOString().split('T')[0] : null;

    const handleSubmit = async () => {
        // Validate salary
        if (!salary.trim()) {
            setSalaryError('Salary is required');
            return;
        }
        const salaryNum = parseFloat(salary);
        if (isNaN(salaryNum) || salaryNum <= 0) {
            setSalaryError('Please enter a valid salary');
            return;
        }

        // For non-CDI contracts, end date is required
        if (contractType !== 'CDI' && !endDate) {
            Alert.alert('Error', 'End date is required for fixed-term contracts');
            return;
        }

        try {
            setSubmitting(true);
            await contractApi.create(employeeId, {
                type: contractType,
                startDate: formatApi(startDate),
                endDate: formatApi(endDate),
                signedSalary: salaryNum,
                isActive: true, // New contract is active
            });

            // Refresh data
            await fetchContractsByEmployee(employeeId);
            await fetchEmployeeById(employeeId);

            Alert.alert('Success', 'Contract created successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            console.error('Create contract error:', e);
            Alert.alert('Error', 'Failed to create contract');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <MaterialCommunityIcons name="file-document-plus" size={48} color={colors.primary} />
                    <Text style={styles.headerTitle}>Add Contract</Text>
                    <Text style={styles.headerSubtitle}>for {employeeName}</Text>
                </View>

                {/* Contract Type */}
                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Contract Type</Text>
                        <SegmentedButtons
                            value={contractType}
                            onValueChange={(v) => {
                                setContractType(v);
                                // CDI doesn't require end date
                                if (v === 'CDI') setEndDate(null);
                            }}
                            buttons={[
                                { value: 'CDI', label: 'Permanent', icon: 'infinity' },
                                { value: 'CDD', label: 'Fixed Term', icon: 'calendar-range' },
                                { value: 'INTERNSHIP', label: 'Internship', icon: 'school' },
                            ]}
                            style={styles.segmented}
                        />
                        <Text style={styles.typeHint}>
                            {contractType === 'CDI' ? '📝 Permanent contract (no end date)' :
                                contractType === 'CDD' ? '📅 Fixed-term contract (end date required)' :
                                    '🎓 Internship contract (end date required)'}
                        </Text>
                    </Card.Content>
                </Card>

                {/* Date Range */}
                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Contract Period</Text>

                        <View style={styles.dateRow}>
                            <View style={styles.dateLabel}>
                                <MaterialCommunityIcons name="calendar-start" size={20} color={colors.textSecondary} />
                                <Text style={styles.dateLabelText}>Start Date</Text>
                            </View>
                            <Button mode="outlined" onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
                                {formatDate(startDate)}
                            </Button>
                        </View>

                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(e, d) => {
                                    setShowStartPicker(Platform.OS === 'ios');
                                    if (d) setStartDate(d);
                                }}
                            />
                        )}

                        {contractType !== 'CDI' && (
                            <>
                                <View style={[styles.dateRow, { marginTop: spacing.md }]}>
                                    <View style={styles.dateLabel}>
                                        <MaterialCommunityIcons name="calendar-end" size={20} color={colors.textSecondary} />
                                        <Text style={styles.dateLabelText}>End Date *</Text>
                                    </View>
                                    <Button mode="outlined" onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
                                        {endDate ? formatDate(endDate) : 'Select date'}
                                    </Button>
                                </View>

                                {showEndPicker && (
                                    <DateTimePicker
                                        value={endDate || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(e, d) => {
                                            setShowEndPicker(Platform.OS === 'ios');
                                            if (d) setEndDate(d);
                                        }}
                                        minimumDate={startDate}
                                    />
                                )}
                            </>
                        )}
                    </Card.Content>
                </Card>

                {/* Salary */}
                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Salary</Text>
                        <TextInput
                            label="Annual Salary ($) *"
                            value={salary}
                            onChangeText={(v) => {
                                setSalary(v);
                                if (salaryError) setSalaryError(null);
                            }}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="numeric"
                            left={<TextInput.Icon icon="currency-usd" />}
                            placeholder="75000"
                            error={!!salaryError}
                        />
                        {salaryError && <Text style={styles.errorText}>{salaryError}</Text>}
                        <Text style={styles.salaryHint}>
                            💡 This will become the employee's current salary
                        </Text>
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={submitting}
                    style={styles.submitBtn}
                    icon="check"
                >
                    Create Contract
                </Button>
                <Button mode="text" onPress={() => navigation.goBack()} textColor={colors.textSecondary}>
                    Cancel
                </Button>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.md },
    headerTitle: { fontSize: typography.h2, fontWeight: typography.bold, color: colors.textPrimary, marginTop: spacing.md },
    headerSubtitle: { fontSize: typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    sectionTitle: { fontSize: typography.h4, fontWeight: typography.semiBold, color: colors.textPrimary, marginBottom: spacing.md },
    segmented: { marginBottom: spacing.sm },
    typeHint: { fontSize: typography.caption, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateLabel: { flexDirection: 'row', alignItems: 'center' },
    dateLabelText: { fontSize: typography.body, color: colors.textSecondary, marginLeft: spacing.sm },
    dateButton: { minWidth: 160 },
    input: { backgroundColor: colors.surface },
    errorText: { color: colors.error, fontSize: typography.caption, marginTop: spacing.xs },
    salaryHint: { fontSize: typography.caption, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
    submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: spacing.lg },
});

export default AddContractScreen;
