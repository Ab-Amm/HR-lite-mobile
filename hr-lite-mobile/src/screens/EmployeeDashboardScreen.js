import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography } from '../theme/theme';

const EmployeeDashboardScreen = () => {
    const { logout } = useApp();

    return (
        <View style={styles.container}>
            <Surface style={styles.content} elevation={2}>
                <Text style={styles.title}>Employee Dashboard</Text>
                <Text style={styles.subtitle}>Welcome, Employee!</Text>
                <Text style={styles.description}>
                    This is a placeholder for the Employee interface. 
                    Features coming soon:
                </Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• View Personal Profile</Text>
                    <Text style={styles.listItem}>• Check Attendance</Text>
                    <Text style={styles.listItem}>• Request Leave</Text>
                    <Text style={styles.listItem}>• View Contracts</Text>
                </View>
                
                <Button 
                    mode="contained" 
                    onPress={logout} 
                    style={styles.button}
                    buttonColor={colors.error}
                >
                    Logout
                </Button>
            </Surface>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    content: {
        padding: spacing.xl,
        borderRadius: 12,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    title: {
        fontSize: typography.h1,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.h2,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: spacing.md,
        color: colors.textPrimary,
    },
    list: {
        alignSelf: 'flex-start',
        marginBottom: spacing.xl,
        paddingLeft: spacing.md,
    },
    listItem: {
        fontSize: 16,
        marginBottom: spacing.xs,
        color: colors.textSecondary,
    },
    button: {
        width: '100%',
        borderRadius: 8,
    },
});

export default EmployeeDashboardScreen;
