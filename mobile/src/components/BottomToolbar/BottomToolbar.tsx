import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';

export interface ToolbarAction {
  key: string;
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}

interface Props {
  actions: ToolbarAction[];
}

/** Floating bottom toolbar shared by the viewer screens. */
export default function BottomToolbar({ actions }: Props) {
  return (
    <View style={styles.container}>
      {actions.map(action => (
        <TouchableOpacity
          key={action.key}
          onPress={action.onPress}
          disabled={action.disabled}
          activeOpacity={0.8}
          style={[
            styles.button,
            action.primary && styles.primaryButton,
            action.disabled && styles.disabled,
          ]}>
          <Text
            style={[styles.label, action.primary && styles.primaryLabel]}
            numberOfLines={1}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: { backgroundColor: colors.primary },
  disabled: { opacity: 0.4 },
  label: { ...typography.button, color: colors.text },
  primaryLabel: { color: '#0B0D12' },
});
