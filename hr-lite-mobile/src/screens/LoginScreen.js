import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography } from '../theme/theme';

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
            <Surface style={styles.content} elevation={2}>
                <View style={styles.header}>
                    <Text style={styles.title}>HR Lite</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Username"
                        value={username}
                        onChangeText={(text) => {
                            setUsername(text);
                            if (error) clearError();
                        }}
                        mode="outlined"
                        style={styles.input}
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="account" />}
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
                            />
                        }
                        left={<TextInput.Icon icon="lock" />}
                    />

                    {error && (
                        <HelperText type="error" visible={!!error}>
                            {error}
                        </HelperText>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading || !username || !password}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                    >
                        Login
                    </Button>
                </View>
            </Surface>
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
    content: {
        padding: spacing.xl,
        borderRadius: 12,
        backgroundColor: 'white',
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: typography.h1,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: spacing.md,
        backgroundColor: 'white',
    },
    button: {
        marginTop: spacing.md,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 6,
    },
});

export default LoginScreen;
