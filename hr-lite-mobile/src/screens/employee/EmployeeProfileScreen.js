import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Modal } from 'react-native';
import { Card, Text, Avatar, Surface, Divider, ActivityIndicator, Button, TextInput, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../api/api';
import { colors, spacing, shadows, typography, borderRadius } from '../../theme/theme';

const EmployeeProfileScreen = () => {
    const { currentEmployee, fetchCurrentEmployee, loading, logout, userId } = useApp();
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!currentEmployee);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!currentEmployee) {
                await fetchCurrentEmployee();
            }
            setInitialLoading(false);
        };
        loadData();
    }, [currentEmployee, fetchCurrentEmployee]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchCurrentEmployee(true); // Force refresh
        setRefreshing(false);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const calculateYearsOfService = (joinDate) => {
        if (!joinDate) return 'N/A';
        const start = new Date(joinDate);
        const now = new Date();
        const years = Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
        const months = Math.floor(((now - start) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
        if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
        return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    };

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

    if (initialLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    const InfoRow = ({ icon, label, value, valueColor }) => (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
                <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
            </View>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            {/* Profile Header */}
            <Surface style={[styles.headerCard, shadows.medium]} elevation={3}>
                <View style={styles.avatarContainer}>
                    <Avatar.Text
                        size={100}
                        label={getInitials(currentEmployee?.fullName)}
                        style={styles.avatar}
                        labelStyle={styles.avatarLabel}
                    />
                    <View style={styles.statusBadge}>
                        <MaterialCommunityIcons name="check-circle" size={28} color={colors.success} />
                    </View>
                </View>
                <Text style={styles.name}>{currentEmployee?.fullName || 'Employee'}</Text>
                <Text style={styles.position}>{currentEmployee?.position || 'Position'}</Text>
                <View style={styles.serviceContainer}>
                    <MaterialCommunityIcons name="trophy-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.serviceText}>{calculateYearsOfService(currentEmployee?.joinDate)} of service</Text>
                </View>
            </Surface>

            {/* Personal Information */}
            <Card style={[styles.card, shadows.small]}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="account-details" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                    </View>
                    <Divider style={styles.divider} />
                    <InfoRow icon="account" label="First Name" value={currentEmployee?.firstName || 'N/A'} />
                    <InfoRow icon="account-outline" label="Last Name" value={currentEmployee?.lastName || 'N/A'} />
                    <InfoRow icon="email" label="Email" value={currentEmployee?.email || 'N/A'} />
                    <InfoRow icon="phone" label="Phone" value={currentEmployee?.phoneNumber || 'Not provided'} />
                </Card.Content>
            </Card>

            {/* Employment Details */}
            <Card style={[styles.card, shadows.small]}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="briefcase" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Employment Details</Text>
                    </View>
                    <Divider style={styles.divider} />
                    <InfoRow icon="badge-account" label="Employee ID" value={`#${currentEmployee?.id || 'N/A'}`} />
                    <InfoRow icon="calendar-start" label="Join Date" value={formatDate(currentEmployee?.joinDate)} />
                    <InfoRow 
                        icon="cash" 
                        label="Current Salary" 
                        value={formatCurrency(currentEmployee?.currentSalary)} 
                        valueColor={colors.success}
                    />
                    <InfoRow icon="shield-account" label="Role" value={currentEmployee?.role || 'EMPLOYEE'} />
                </Card.Content>
            </Card>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
                <Surface style={[styles.statCard, shadows.small]} elevation={2}>
                    <MaterialCommunityIcons name="file-document-multiple" size={28} color={colors.info} />
                    <Text style={styles.statValue}>{currentEmployee?.contracts?.length || 0}</Text>
                    <Text style={styles.statLabel}>Contracts</Text>
                </Surface>
                <Surface style={[styles.statCard, shadows.small]} elevation={2}>
                    <MaterialCommunityIcons name="calendar-check" size={28} color={colors.warning} />
                    <Text style={styles.statValue}>{currentEmployee?.leaveRequests?.length || 0}</Text>
                    <Text style={styles.statLabel}>Leave Requests</Text>
                </Surface>
            </View>

            {/* Account Settings */}
            <Card style={[styles.card, shadows.small]}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Account Settings</Text>
                    </View>
                    <Divider style={styles.divider} />
                    
                    <Button
                        mode="outlined"
                        onPress={() => setShowPasswordDialog(true)}
                        style={[styles.actionButton, { borderColor: colors.primary }]}
                        textColor={colors.primary}
                        icon="lock-reset"
                        contentStyle={styles.actionButtonContent}
                    >
                        Change Password
                    </Button>

                    <Button
                        mode="contained"
                        onPress={logout}
                        style={[styles.actionButton, { marginTop: spacing.md, backgroundColor: colors.error }]}
                        icon="logout"
                        contentStyle={styles.actionButtonContent}
                    >
                        Logout
                    </Button>
                </Card.Content>
            </Card>

            <Portal>
                <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)} style={{ backgroundColor: colors.surface }}>
                    <Dialog.Title>Change Password</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Old Password"
                            value={passwordForm.oldPassword}
                            onChangeText={(text) => setPasswordForm({ ...passwordForm, oldPassword: text })}
                            secureTextEntry
                            mode="outlined"
                            style={{ marginBottom: spacing.sm }}
                        />
                        <TextInput
                            label="New Password"
                            value={passwordForm.newPassword}
                            onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                            secureTextEntry
                            mode="outlined"
                            style={{ marginBottom: spacing.sm }}
                        />
                        <TextInput
                            label="Confirm Password"
                            value={passwordForm.confirmPassword}
                            onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                            secureTextEntry
                            mode="outlined"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowPasswordDialog(false)}>Cancel</Button>
                        <Button onPress={handleChangePassword} loading={passwordLoading} disabled={passwordLoading}>Change</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
    headerCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    avatar: {
        backgroundColor: colors.primary,
    },
    avatarLabel: {
        fontSize: 36,
        fontWeight: typography.bold,
    },
    statusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 2,
    },
    name: {
        fontSize: typography.h2,
        fontWeight: typography.bold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    position: {
        fontSize: typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    serviceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
        borderWidth: 1,
        borderColor: colors.border,
    },
    serviceText: {
        fontSize: typography.caption,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
        fontWeight: typography.medium,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: typography.h4,
        fontWeight: typography.semiBold,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    divider: {
        marginBottom: spacing.md,
        backgroundColor: colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: typography.caption,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: typography.body,
        color: colors.textPrimary,
        fontWeight: typography.medium,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        marginHorizontal: spacing.xs,
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
    actionButton: {
        borderRadius: borderRadius.md,
    },
    actionButtonContent: {
        paddingVertical: spacing.xs,
    },
});

export default EmployeeProfileScreen;
