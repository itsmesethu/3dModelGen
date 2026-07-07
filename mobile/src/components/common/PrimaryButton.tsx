import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#0B0D12' : colors.text} />
      ) : (
        <Text
          style={[styles.label, variant !== 'primary' && styles.altLabel]}
          numberOfLines={1}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.45 },
  label: { ...typography.button, color: '#0B0D12' },
  altLabel: { color: colors.text },
});
