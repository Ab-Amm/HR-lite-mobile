import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, Surface, ActivityIndicator, Divider, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { contractApi } from '../../api/api';
import { colors, spacing, shadows, typography, borderRadius } from '../../theme/theme';

const EmployeeContractsScreen = () => {
    const { currentEmployee } = useApp();
    const [contracts, setContracts] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);

    const fetchContracts = useCallback(async (showLoading = true) => {
        if (!currentEmployee?.id) return;
        try {
            if (showLoading && !dataLoaded) setInitialLoading(true);
            const response = await contractApi.getByEmployeeId(currentEmployee.id);
            setContracts(response.data || []);
            setDataLoaded(true);
        } catch (err) {
            console.error('Contract fetch error:', err);
        } finally {
            setInitialLoading(false);
        }
    }, [currentEmployee?.id, dataLoaded]);

    useFocusEffect(
        useCallback(() => {
            fetchContracts();
        }, [fetchContracts])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchContracts(false);
        setRefreshing(false);
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

    const getContractTypeConfig = (type) => {
        switch (type) {
            case 'CDI':
                return { color: colors.success, icon: 'infinity', label: 'Permanent (CDI)', description: 'Indefinite Duration Contract' };
            case 'CDD':
                return { color: colors.warning, icon: 'calendar-clock', label: 'Fixed-Term (CDD)', description: 'Fixed Duration Contract' };
            case 'INTERNSHIP':
                return { color: colors.info, icon: 'school', label: 'Internship', description: 'Training Contract' };
            case 'FREELANCE':
                return { color: colors.primary, icon: 'briefcase-outline', label: 'Freelance', description: 'Independent Contract' };
            default:
                return { color: colors.textSecondary, icon: 'file-document', label: type || 'Unknown', description: 'Contract' };
        }
    };

    const calculateDuration = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        const months = Math.floor((end - start) / (30.44 * 24 * 60 * 60 * 1000));
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        
        if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths > 0 ? `${remainingMonths} mo` : ''}`.trim();
    };

    const isExpiringSoon = (endDate) => {
        if (!endDate) return false;
        const end = new Date(endDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    };

    const isExpired = (endDate) => {
        if (!endDate) return false;
        const end = new Date(endDate);
        return end < new Date();
    };

    // Stats
    const activeContracts = contracts.filter(c => c.isActive && !isExpired(c.endDate)).length;
    const currentContract = contracts.find(c => c.isActive && !isExpired(c.endDate));

    if (initialLoading && !dataLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading contracts...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            {/* Current Contract Summary */}
            {currentContract && (
                <Surface style={[styles.currentCard, shadows.medium]} elevation={3}>
                    <View style={styles.currentHeader}>
                        <MaterialCommunityIcons name="file-certificate" size={32} color={colors.primary} />
                        <View style={styles.currentHeaderText}>
                            <Text style={styles.currentLabel}>Current Contract</Text>
                            <Text style={styles.currentType}>{getContractTypeConfig(currentContract.type).label}</Text>
                        </View>
                        <Chip
                            icon={() => <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />}
                            style={styles.activeChip}
                            textStyle={styles.activeChipText}
                        >
                            Active
                        </Chip>
                    </View>
                    
                    <Divider style={styles.currentDivider} />
                    
                    <View style={styles.currentDetails}>
                        <View style={styles.currentDetailItem}>
                            <MaterialCommunityIcons name="cash" size={20} color={colors.success} />
                            <View style={styles.currentDetailText}>
                                <Text style={styles.currentDetailLabel}>Salary</Text>
                                <Text style={styles.currentDetailValue}>{formatCurrency(currentContract.signedSalary)}</Text>
                            </View>
                        </View>
                        <View style={styles.currentDetailItem}>
                            <MaterialCommunityIcons name="calendar-start" size={20} color={colors.info} />
                            <View style={styles.currentDetailText}>
                                <Text style={styles.currentDetailLabel}>Started</Text>
                                <Text style={styles.currentDetailValue}>{formatDate(currentContract.startDate)}</Text>
                            </View>
                        </View>
                        <View style={styles.currentDetailItem}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.warning} />
                            <View style={styles.currentDetailText}>
                                <Text style={styles.currentDetailLabel}>Duration</Text>
                                <Text style={styles.currentDetailValue}>{calculateDuration(currentContract.startDate, currentContract.endDate)}</Text>
                            </View>
                        </View>
                    </View>

                    {isExpiringSoon(currentContract.endDate) && (
                        <View style={styles.expiryWarning}>
                            <MaterialCommunityIcons name="alert-circle" size={18} color={colors.warning} />
                            <Text style={styles.expiryWarningText}>Contract expires on {formatDate(currentContract.endDate)}</Text>
                        </View>
                    )}
                </Surface>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
                <Surface style={[styles.statCard, shadows.small]} elevation={2}>
                    <MaterialCommunityIcons name="file-document-multiple" size={24} color={colors.primary} />
                    <Text style={styles.statValue}>{contracts.length}</Text>
                    <Text style={styles.statLabel}>Total Contracts</Text>
                </Surface>
                <Surface style={[styles.statCard, shadows.small]} elevation={2}>
                    <MaterialCommunityIcons name="check-decagram" size={24} color={colors.success} />
                    <Text style={styles.statValue}>{activeContracts}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </Surface>
            </View>

            {/* All Contracts */}
            <Card style={[styles.listCard, shadows.small]}>
                <Card.Content>
                    <View style={styles.listHeader}>
                        <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
                        <Text style={styles.listTitle}>Contract History</Text>
                    </View>
                    <Divider style={styles.divider} />

                    {contracts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="file-document-outline" size={64} color={colors.textLight} />
                            <Text style={styles.emptyTitle}>No Contracts Found</Text>
                            <Text style={styles.emptyText}>Your contract history will appear here</Text>
                        </View>
                    ) : (
                        contracts.map((contract, index) => {
                            const typeConfig = getContractTypeConfig(contract.type);
                            const expired = isExpired(contract.endDate);
                            const expiringSoon = isExpiringSoon(contract.endDate);
                            const isActive = contract.isActive && !expired;

                            return (
                                <Surface key={contract.id || index} style={[styles.contractItem, shadows.small]} elevation={1}>
                                    <View style={styles.contractHeader}>
                                        <View style={[styles.contractIcon, { backgroundColor: typeConfig.color + '20' }]}>
                                            <MaterialCommunityIcons name={typeConfig.icon} size={24} color={typeConfig.color} />
                                        </View>
                                        <View style={styles.contractHeaderText}>
                                            <Text style={styles.contractType}>{typeConfig.label}</Text>
                                            <Text style={styles.contractDesc}>{typeConfig.description}</Text>
                                        </View>
                                        {isActive ? (
                                            <Chip
                                                style={[styles.statusChip, { backgroundColor: colors.success + '20' }]}
                                                textStyle={{ color: colors.success, fontSize: 10 }}
                                            >
                                                Active
                                            </Chip>
                                        ) : expired ? (
                                            <Chip
                                                style={[styles.statusChip, { backgroundColor: colors.error + '20' }]}
                                                textStyle={{ color: colors.error, fontSize: 10 }}
                                            >
                                                Expired
                                            </Chip>
                                        ) : (
                                            <Chip
                                                style={[styles.statusChip, { backgroundColor: colors.textSecondary + '20' }]}
                                                textStyle={{ color: colors.textSecondary, fontSize: 10 }}
                                            >
                                                Inactive
                                            </Chip>
                                        )}
                                    </View>

                                    <View style={styles.contractDetails}>
                                        <View style={styles.contractDetailRow}>
                                            <View style={styles.contractDetail}>
                                                <MaterialCommunityIcons name="calendar-range" size={16} color={colors.textSecondary} />
                                                <Text style={styles.contractDetailText}>
                                                    {formatDate(contract.startDate)} - {contract.endDate ? formatDate(contract.endDate) : 'Indefinite'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.contractDetailRow}>
                                            <View style={styles.contractDetail}>
                                                <MaterialCommunityIcons name="cash" size={16} color={colors.success} />
                                                <Text style={[styles.contractDetailText, { color: colors.success, fontWeight: typography.semiBold }]}>
                                                    {formatCurrency(contract.signedSalary)}
                                                </Text>
                                            </View>
                                            <View style={styles.contractDetail}>
                                                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
                                                <Text style={styles.contractDetailText}>
                                                    {calculateDuration(contract.startDate, contract.endDate)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {expiringSoon && (
                                        <View style={styles.contractWarning}>
                                            <MaterialCommunityIcons name="alert" size={14} color={colors.warning} />
                                            <Text style={styles.contractWarningText}>Expires soon</Text>
                                        </View>
                                    )}
                                </Surface>
                            );
                        })
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
    currentCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    currentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentHeaderText: {
        flex: 1,
        marginLeft: spacing.md,
    },
    currentLabel: {
        fontSize: typography.caption,
        color: colors.textSecondary,
    },
    currentType: {
        fontSize: typography.h4,
        fontWeight: typography.bold,
        color: colors.textPrimary,
    },
    activeChip: {
        backgroundColor: colors.success + '20',
    },
    activeChipText: {
        color: colors.success,
        fontSize: 12,
    },
    currentDivider: {
        marginVertical: spacing.md,
        backgroundColor: colors.border,
    },
    currentDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    currentDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    currentDetailText: {
        marginLeft: spacing.sm,
    },
    currentDetailLabel: {
        fontSize: typography.caption,
        color: colors.textSecondary,
    },
    currentDetailValue: {
        fontSize: typography.bodySmall,
        fontWeight: typography.semiBold,
        color: colors.textPrimary,
    },
    expiryWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.warning + '15',
        borderRadius: borderRadius.md,
    },
    expiryWarningText: {
        fontSize: typography.bodySmall,
        color: colors.warning,
        marginLeft: spacing.sm,
        fontWeight: typography.medium,
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
        padding: spacing.lg,
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
    contractItem: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    contractHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    contractIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contractHeaderText: {
        flex: 1,
        marginLeft: spacing.md,
    },
    contractType: {
        fontSize: typography.body,
        fontWeight: typography.semiBold,
        color: colors.textPrimary,
    },
    contractDesc: {
        fontSize: typography.caption,
        color: colors.textSecondary,
    },
    statusChip: {
        height: 24,
    },
    contractDetails: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
    },
    contractDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    contractDetail: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contractDetailText: {
        fontSize: typography.bodySmall,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
    },
    contractWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    contractWarningText: {
        fontSize: typography.caption,
        color: colors.warning,
        marginLeft: spacing.xs,
    },
});

export default EmployeeContractsScreen;
