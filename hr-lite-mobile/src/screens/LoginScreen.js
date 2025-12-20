import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography, borderRadius } from '../theme/theme';
import AnimatedLogo from '../components/AnimatedLogo';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
    const { login, loading, error, clearError } = useApp();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const handleLogin = async () => {
        if (!username || !password) return;
        await login(username, password);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.logoContainer}>
                <Surface style={styles.logoSurface} elevation={4}>
                    <AnimatedLogo size={70} />
                </Surface>
                <Text style={styles.appName}>HR Lite</Text>
                <Text style={styles.tagline}>Manage your workforce efficiently</Text>
            </View>

            <Surface style={styles.formCard} elevation={2}>
                <Text style={styles.welcomeText}>Welcome Back!</Text>
                <Text style={styles.instructionText}>Please sign in to continue</Text>

                <View style={styles.form}>
                    <TextInput
                        label="Email / Username"
                        value={username}
                        onChangeText={(text) => {
                            setUsername(text);
                            if (error) clearError();
                        }}
                        mode="outlined"
                        style={styles.input}
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="account" color={colors.primary} />}
                        outlineColor={colors.border}
                        activeOutlineColor={colors.primary}
                    />

                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (error) clearError();
                        }}
                        mode="outlined"
                        style={styles.input}
                        secureTextEntry={secureTextEntry}
                        right={
                            <TextInput.Icon
                                icon={secureTextEntry ? "eye" : "eye-off"}
                                onPress={() => setSecureTextEntry(!secureTextEntry)}
                                color={colors.textSecondary}
                            />
                        }
                        left={<TextInput.Icon icon="lock" color={colors.primary} />}
                        outlineColor={colors.border}
                        activeOutlineColor={colors.primary}
                    />

                    {error && (
                        <View style={styles.errorContainer}>
                            <HelperText type="error" visible={!!error} style={styles.errorText}>
                                {error}
                            </HelperText>
                        </View>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading || !username || !password}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.buttonLabel}
                    >
                        LOGIN
                    </Button>
                </View>
            </Surface>
            
            <View style={styles.footer}>
                <Text style={styles.footerText}>© 2025 HR Lite System</Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoSurface: {
        width: 100,
        height: 100,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        marginBottom: spacing.md,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    formCard: {
        padding: spacing.xl,
        borderRadius: borderRadius.xl,
        backgroundColor: 'white',
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    welcomeText: {
        fontSize: typography.h3,
        fontWeight: 'bold',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    instructionText: {
        fontSize: typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: spacing.md,
        backgroundColor: 'white',
    },
    errorContainer: {
        marginBottom: spacing.sm,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
    },
    button: {
        marginTop: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
    },
    buttonContent: {
        paddingVertical: spacing.sm,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
        color: '#FFFFFF',
    },
    footer: {
        position: 'absolute',
        bottom: spacing.lg,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    footerText: {
        color: colors.textLight,
        fontSize: typography.caption,
    },
});

export default LoginScreen;
