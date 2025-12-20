import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { leaveApi } from '../api/api';
import { colors, spacing, shadows, typography, borderRadius } from '../theme/theme';

const EmployeesOnLeaveScreen = ({ navigation }) => {
    const [employeesOnLeave, setEmployeesOnLeave] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEmployeesOnLeave = useCallback(async () => {
        try {
            setLoading(true);
            const response = await leaveApi.getOnLeave();
            setEmployeesOnLeave(response.data);
        } catch (err) {
            console.error('Failed to fetch employees on leave', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchEmployeesOnLeave(); }, [fetchEmployeesOnLeave]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchEmployeesOnLeave();
        setRefreshing(false);
    }, [fetchEmployeesOnLeave]);

    const getInitials = (name) => name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '??';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

    const LeaveCard = ({ item }) => (
        <Card style={[styles.card, shadows.small]} onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.employee.id })}>
            <Card.Content style={styles.cardContent}>
                <Avatar.Text size={50} label={getInitials(item.employee.fullName)} style={styles.avatar} />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.employee.fullName}</Text>
                    <Text style={styles.position}>{item.employee.position}</Text>
                    <View style={styles.leaveInfo}>
                        <MaterialCommunityIcons name="calendar-range" size={14} color={colors.warning} />
                        <Text style={styles.leaveDate}> Until {formatDate(item.endDate)}</Text>
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
            </Card.Content>
        </Card>
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="beach" size={80} color={colors.success} />
            <Text style={styles.emptyTitle}>Everyone is here!</Text>
            <Text style={styles.emptySubtitle}>No employees are on leave today</Text>
        </View>
    );

    if (loading && employeesOnLeave.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={employeesOnLeave}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <LeaveCard item={item} />}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListEmptyComponent={<EmptyState />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    listContent: { padding: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    avatar: { marginRight: spacing.md, backgroundColor: colors.primaryLight },
    info: { flex: 1 },
    name: { fontSize: typography.body, fontWeight: typography.semiBold, color: colors.textPrimary },
    position: { fontSize: typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
    leaveInfo: { flexDirection: 'row', alignItems: 'center' },
    leaveDate: { fontSize: typography.caption, color: colors.warning, fontWeight: typography.medium },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxl * 2 },
    emptyTitle: { fontSize: typography.h3, fontWeight: typography.semiBold, color: colors.textPrimary, marginTop: spacing.md },
    emptySubtitle: { fontSize: typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});

export default EmployeesOnLeaveScreen;
