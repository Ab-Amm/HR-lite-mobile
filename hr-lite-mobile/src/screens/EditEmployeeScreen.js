import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, spacing, shadows, typography, borderRadius } from '../theme/theme';

const EditEmployeeScreen = ({ route, navigation }) => {
    const { employeeId } = route.params;
    const { selectedEmployee, updateEmployee, fetchEmployeeById } = useApp();
    const [form, setForm] = useState({ fullName: '', email: '', position: '', currentSalary: '', phoneNumber: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEmployee = async () => {
            if (!selectedEmployee || selectedEmployee.id !== employeeId) {
                await fetchEmployeeById(employeeId);
            }
            setLoading(false);
        };
        loadEmployee();
    }, [employeeId, fetchEmployeeById, selectedEmployee]);

    useEffect(() => {
        if (selectedEmployee && selectedEmployee.id === employeeId) {
            setForm({
                fullName: selectedEmployee.fullName || '',
                email: selectedEmployee.email || '',
                position: selectedEmployee.position || '',
                currentSalary: selectedEmployee.currentSalary?.toString() || '',
                phoneNumber: selectedEmployee.phoneNumber || '',
            });
        }
    }, [selectedEmployee, employeeId]);

    const updateField = (f, v) => {
        setForm((p) => ({ ...p, [f]: v }));
        if (errors[f]) setErrors((p) => ({ ...p, [f]: null }));
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Required';
        if (!form.email.trim()) e.email = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (!form.position.trim()) e.position = 'Required';
        if (!form.currentSalary.trim()) e.currentSalary = 'Required';
        else if (isNaN(parseFloat(form.currentSalary)) || parseFloat(form.currentSalary) <= 0) e.currentSalary = 'Invalid salary';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            setSubmitting(true);
            await updateEmployee(employeeId, {
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                position: form.position.trim(),
                currentSalary: parseFloat(form.currentSalary),
                phoneNumber: form.phoneNumber.trim() || null,
                joinDate: selectedEmployee.joinDate, // Keep original join date
            });
            Alert.alert('Success', 'Employee updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (e) {
            Alert.alert('Error', 'Failed to update employee');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <MaterialCommunityIcons name="account-edit" size={48} color={colors.primary} />
                    <Text style={styles.headerTitle}>Edit Employee</Text>
                </View>

                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        <TextInput
                            label="Full Name *"
                            value={form.fullName}
                            onChangeText={(v) => updateField('fullName', v)}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.fullName}
                            left={<TextInput.Icon icon="account" />}
                        />
                        {errors.fullName && <HelperText type="error">{errors.fullName}</HelperText>}

                        <TextInput
                            label="Email *"
                            value={form.email}
                            onChangeText={(v) => updateField('email', v)}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            left={<TextInput.Icon icon="email" />}
                        />
                        {errors.email && <HelperText type="error">{errors.email}</HelperText>}

                        <TextInput
                            label="Phone"
                            value={form.phoneNumber}
                            onChangeText={(v) => updateField('phoneNumber', v)}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="phone-pad"
                            left={<TextInput.Icon icon="phone" />}
                        />
                    </Card.Content>
                </Card>

                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Employment Details</Text>
                        <TextInput
                            label="Position *"
                            value={form.position}
                            onChangeText={(v) => updateField('position', v)}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.position}
                            left={<TextInput.Icon icon="briefcase" />}
                        />
                        {errors.position && <HelperText type="error">{errors.position}</HelperText>}

                        <TextInput
                            label="Annual Salary ($) *"
                            value={form.currentSalary}
                            onChangeText={(v) => updateField('currentSalary', v)}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.currentSalary}
                            keyboardType="numeric"
                            left={<TextInput.Icon icon="currency-usd" />}
                        />
                        {errors.currentSalary && <HelperText type="error">{errors.currentSalary}</HelperText>}
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
                    Save Changes
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.md },
    headerTitle: { fontSize: typography.h2, fontWeight: typography.bold, color: colors.textPrimary, marginTop: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    sectionTitle: { fontSize: typography.h4, fontWeight: typography.semiBold, color: colors.textPrimary, marginBottom: spacing.md },
    input: { marginBottom: spacing.sm, backgroundColor: colors.surface },
    submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: spacing.md },
});

export default EditEmployeeScreen;
