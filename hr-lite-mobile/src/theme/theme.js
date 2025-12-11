// HR Lite Theme Configuration
// Based on the Master Plan Design Guidelines

export const colors = {
    // Primary colors (Corporate Navy Blue)
    primary: '#1E3A8A',
    primaryLight: '#3B5CB8',
    primaryDark: '#152C6B',

    // Background colors
    background: '#F3F4F6',
    surface: '#FFFFFF',

    // Status colors
    success: '#10B981',   // Green for Approved
    warning: '#F59E0B',   // Amber for Pending
    error: '#EF4444',     // Red for Rejected
    info: '#3B82F6',

    // Text colors
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    textOnPrimary: '#FFFFFF',

    // Border colors
    border: '#E5E7EB',
    borderFocus: '#1E3A8A',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
};

export const typography = {
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
};

// React Native Paper theme
export const paperTheme = {
    colors: {
        primary: colors.primary,
        primaryContainer: colors.primaryLight,
        secondary: colors.info,
        secondaryContainer: '#DBEAFE',
        surface: colors.surface,
        surfaceVariant: colors.background,
        background: colors.background,
        error: colors.error,
        errorContainer: '#FEE2E2',
        onPrimary: colors.textOnPrimary,
        onPrimaryContainer: colors.primary,
        onSecondary: colors.textOnPrimary,
        onSurface: colors.textPrimary,
        onSurfaceVariant: colors.textSecondary,
        onBackground: colors.textPrimary,
        onError: colors.textOnPrimary,
        outline: colors.border,
        shadow: '#000',
    },
    roundness: borderRadius.md,
};

export default { colors, spacing, borderRadius, typography, shadows, paperTheme };
