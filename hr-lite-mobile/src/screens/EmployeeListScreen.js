import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Searchbar, Avatar, Chip, ActivityIndicator, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, spacing, shadows, typography, borderRadius } from '../theme/theme';

const EmployeeListScreen = ({ navigation }) => {
    const { employees, loading, fetchEmployees } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(useCallback(() => { fetchEmployees(); }, [fetchEmployees]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchEmployees();
        setRefreshing(false);
    }, [fetchEmployees]);

    const filteredEmployees = employees.filter((e) => {
        const q = searchQuery.toLowerCase();
        return e.fullName.toLowerCase().includes(q) || e.position.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    });

    const getInitials = (name) => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    const getAvatarColor = (name) => {
        const palette = ['#1E3A8A', '#7C3AED', '#059669', '#DC2626', '#D97706', '#2563EB', '#7C2D12', '#4338CA'];
        return palette[name.charCodeAt(0) % palette.length];
    };

    const EmployeeCard = ({ employee }) => (
        <Card style={[styles.employeeCard, shadows.small]} onPress={() => navigation.navigate('EmployeeDetail', { employeeId: employee.id })}>
            <Card.Content style={styles.cardContent}>
                <Avatar.Text size={56} label={getInitials(employee.fullName)} style={[styles.avatar, { backgroundColor: getAvatarColor(employee.fullName) }]} />
                <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName} numberOfLines={1}>{employee.fullName}</Text>
                    <Text style={styles.employeePosition} numberOfLines={1}>{employee.position}</Text>
                    <Chip icon={() => <MaterialCommunityIcons name="email-outline" size={14} color={colors.textSecondary} />} textStyle={styles.chipText} style={styles.chip} compact>
                        {employee.email.split('@')[0]}
                    </Chip>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
            </Card.Content>
        </Card>
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search-outline" size={80} color={colors.textLight} />
            <Text style={styles.emptyTitle}>{searchQuery ? 'No Results Found' : 'No Employees Yet'}</Text>
            <Text style={styles.emptySubtitle}>{searchQuery ? 'Try adjusting your search' : 'Add your first employee'}</Text>
        </View>
    );

    if (loading && employees.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading employees...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Searchbar placeholder="Search by name, position, or email..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchbar} />
            </View>
            <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>{filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}</Text>
            </View>
            <FlatList
                data={filteredEmployees}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <EmployeeCard employee={item} />}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListEmptyComponent={<EmptyState />}
            />
            <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('AddEmployee')} color={colors.textOnPrimary} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    loadingText: { marginTop: spacing.md, color: colors.textSecondary },
    searchContainer: { padding: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.surface, ...shadows.small },
    searchbar: { backgroundColor: colors.background, borderRadius: borderRadius.md, elevation: 0 },
    resultsHeader: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    resultsCount: { fontSize: typography.caption, color: colors.textSecondary },
    listContent: { padding: spacing.md, paddingTop: 0, paddingBottom: 100 },
    employeeCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    avatar: { marginRight: spacing.md },
    employeeInfo: { flex: 1 },
    employeeName: { fontSize: typography.body, fontWeight: typography.semiBold, color: colors.textPrimary },
    employeePosition: { fontSize: typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    chip: { backgroundColor: colors.background, height: 26, marginTop: spacing.sm, alignSelf: 'flex-start' },
    chipText: { fontSize: typography.caption, color: colors.textSecondary },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxl * 2 },
    emptyTitle: { fontSize: typography.h3, fontWeight: typography.semiBold, color: colors.textPrimary, marginTop: spacing.md },
    emptySubtitle: { fontSize: typography.body, color: colors.textSecondary, marginTop: spacing.sm },
    fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.primary },
});

export default EmployeeListScreen;
