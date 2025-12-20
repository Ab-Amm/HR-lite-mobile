import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, HelperText, Snackbar, Portal, Dialog, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { colors, spacing, shadows, typography, borderRadius } from '../theme/theme';

const AddEmployeeScreen = ({ navigation }) => {
    const { createEmployee } = useApp();
    const [form, setForm] = useState({ fullName: '', email: '', password: '', position: '', currentSalary: '', phoneNumber: '' });
    const [joinDate, setJoinDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    
    // UI Feedback State
    const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' });
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);

    const updateField = (f, v) => { setForm((p) => ({ ...p, [f]: v })); if (errors[f]) setErrors((p) => ({ ...p, [f]: null })); };
    const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const formatApi = (d) => d.toISOString().split('T')[0];

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Required';
        if (!form.email.trim()) e.email = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (!form.password.trim()) e.password = 'Required';
        else if (form.password.length < 6) e.password = 'Min 6 chars';
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
            await createEmployee({ 
                fullName: form.fullName.trim(), 
                email: form.email.trim().toLowerCase(), 
                password: form.password,
                position: form.position.trim(), 
                currentSalary: parseFloat(form.currentSalary), 
                joinDate: formatApi(joinDate), 
                phoneNumber: form.phoneNumber.trim() || null 
            });
            setSuccessDialogVisible(true);
        } catch (e) { 
            setSnackbar({ visible: true, message: 'Failed to add employee. Please try again.', type: 'error' });
        } finally { 
            setSubmitting(false); 
        }
    };

    const handleSuccessDismiss = () => {
        setSuccessDialogVisible(false);
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.header}><MaterialCommunityIcons name="account-plus" size={48} color={colors.primary} /><Text style={styles.headerTitle}>Add New Employee</Text></View>

                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        <TextInput label="Full Name *" value={form.fullName} onChangeText={(v) => updateField('fullName', v)} mode="outlined" style={styles.input} error={!!errors.fullName} left={<TextInput.Icon icon="account" />} placeholder="John Doe" />
                        {errors.fullName && <HelperText type="error">{errors.fullName}</HelperText>}
                        <TextInput label="Email *" value={form.email} onChangeText={(v) => updateField('email', v)} mode="outlined" style={styles.input} error={!!errors.email} keyboardType="email-address" autoCapitalize="none" left={<TextInput.Icon icon="email" />} placeholder="john@company.com" />
                        {errors.email && <HelperText type="error">{errors.email}</HelperText>}
                        <TextInput label="Password *" value={form.password} onChangeText={(v) => updateField('password', v)} mode="outlined" style={styles.input} error={!!errors.password} secureTextEntry left={<TextInput.Icon icon="lock" />} placeholder="******" />
                        {errors.password && <HelperText type="error">{errors.password}</HelperText>}
                        <TextInput label="Phone" value={form.phoneNumber} onChangeText={(v) => updateField('phoneNumber', v)} mode="outlined" style={styles.input} keyboardType="phone-pad" left={<TextInput.Icon icon="phone" />} placeholder="+1 555 123 4567" />
                    </Card.Content>
                </Card>

                <Card style={[styles.card, shadows.small]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Employment Details</Text>
                        <TextInput label="Position *" value={form.position} onChangeText={(v) => updateField('position', v)} mode="outlined" style={styles.input} error={!!errors.position} left={<TextInput.Icon icon="briefcase" />} placeholder="Software Engineer" />
                        {errors.position && <HelperText type="error">{errors.position}</HelperText>}
                        <TextInput label="Annual Salary ($) *" value={form.currentSalary} onChangeText={(v) => updateField('currentSalary', v)} mode="outlined" style={styles.input} error={!!errors.currentSalary} keyboardType="numeric" left={<TextInput.Icon icon="currency-usd" />} placeholder="75000" />
                        {errors.currentSalary && <HelperText type="error">{errors.currentSalary}</HelperText>}
                        <View style={styles.dateRow}><View style={styles.dateLabel}><MaterialCommunityIcons name="calendar-start" size={20} color={colors.textSecondary} /><Text style={styles.dateLabelText}>Join Date</Text></View><Button mode="outlined" onPress={() => setShowPicker(true)}>{formatDate(joinDate)}</Button></View>
                        {showPicker && <DateTimePicker value={joinDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { setShowPicker(Platform.OS === 'ios'); if (d) setJoinDate(d); }} />}
                    </Card.Content>
                </Card>

                <View style={styles.note}><MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} /><Text style={styles.noteText}>* Required fields</Text></View>
                <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.submitBtn} icon="check">Add Employee</Button>
                <Button mode="text" onPress={() => navigation.goBack()} textColor={colors.textSecondary}>Cancel</Button>
            </ScrollView>

            <Portal>
                {/* Success Dialog */}
                <Dialog visible={successDialogVisible} onDismiss={handleSuccessDismiss} style={{ backgroundColor: colors.surface }}>
                    <Dialog.Icon icon="check-circle" size={50} color={colors.success} />
                    <Dialog.Title style={{ textAlign: 'center' }}>Success</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph style={{ textAlign: 'center' }}>Employee has been successfully added to the system.</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'center' }}>
                        <Button onPress={handleSuccessDismiss} mode="contained" style={{ paddingHorizontal: 20 }}>Done</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Error Snackbar */}
                <Snackbar
                    visible={snackbar.visible}
                    onDismiss={() => setSnackbar(p => ({ ...p, visible: false }))}
                    duration={3000}
                    style={{ backgroundColor: snackbar.type === 'error' ? colors.error : colors.success }}
                    action={{ label: 'Close', onPress: () => setSnackbar(p => ({ ...p, visible: false })) }}
                >
                    {snackbar.message}
                </Snackbar>
            </Portal>
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
    input: { marginBottom: spacing.sm, backgroundColor: colors.surface },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
    dateLabel: { flexDirection: 'row', alignItems: 'center' },
    dateLabelText: { fontSize: typography.body, color: colors.textSecondary, marginLeft: spacing.sm },
    note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md },
    noteText: { fontSize: typography.caption, color: colors.textSecondary, marginLeft: spacing.xs },
    submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md },
});

export default AddEmployeeScreen;
