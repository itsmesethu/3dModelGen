import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { StageStatus } from '../../services/reconstruction/types';
import { colors, radii, spacing, typography } from '../../theme';

interface Props {
  stages: StageStatus[];
}

function StageIcon({ state }: { state: StageStatus['state'] }) {
  if (state === 'running') {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }
  const glyph = state === 'done' ? '✓' : state === 'failed' ? '✕' : '○';
  const color =
    state === 'done'
      ? colors.success
      : state === 'failed'
      ? colors.danger
      : colors.subtext;
  return <Text style={[styles.icon, { color }]}>{glyph}</Text>;
}

/** Vertical list of pipeline stages with live status. */
export default function ProgressStepper({ stages }: Props) {
  return (
    <View style={styles.container}>
      {stages.map(stage => (
        <View key={stage.key} style={styles.row}>
          <View style={styles.iconSlot}>
            <StageIcon state={stage.state} />
          </View>
          <Text
            style={[
              styles.label,
              stage.state === 'running' && styles.runningLabel,
              stage.state === 'done' && styles.doneLabel,
            ]}>
            {stage.label}
          </Text>
          <Text style={styles.stateText}>
            {stage.state === 'waiting' ? 'Waiting…' : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconSlot: { width: 24, alignItems: 'center' },
  icon: { fontSize: 16, fontWeight: '700' },
  label: { ...typography.body, flex: 1, color: colors.subtext },
  runningLabel: { color: colors.text, fontWeight: '600' },
  doneLabel: { color: colors.text },
  stateText: { ...typography.caption },
});
