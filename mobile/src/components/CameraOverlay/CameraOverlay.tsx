import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Ellipse, Line, Rect } from 'react-native-svg';

import type { CaptureStep } from '../../services/camera/captureGuide';
import { colors, radii, spacing, typography } from '../../theme';

interface Props {
  steps: CaptureStep[];
  currentIndex: number;
  guidance: string;
}

/**
 * Silhouette + framing guides drawn over the live camera preview,
 * with per-angle progress chips and guidance text.
 */
export default function CameraOverlay({ steps, currentIndex, guidance }: Props) {
  const { width, height } = useWindowDimensions();
  const silhouetteRx = width * 0.36;
  const silhouetteRy = height * 0.26;
  const centerX = width / 2;
  const centerY = height * 0.44;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        {/* Framing rectangle */}
        <Rect
          x={width * 0.06}
          y={height * 0.12}
          width={width * 0.88}
          height={height * 0.62}
          rx={24}
          stroke={colors.border}
          strokeWidth={1.5}
          strokeDasharray="10 8"
          fill="none"
        />
        {/* Object silhouette */}
        <Ellipse
          cx={centerX}
          cy={centerY}
          rx={silhouetteRx}
          ry={silhouetteRy}
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeDasharray="14 10"
          fill="rgba(108, 140, 255, 0.06)"
        />
        {/* Center crosshair */}
        <Line
          x1={centerX - 14}
          y1={centerY}
          x2={centerX + 14}
          y2={centerY}
          stroke={colors.primary}
          strokeWidth={1.5}
        />
        <Line
          x1={centerX}
          y1={centerY - 14}
          x2={centerX}
          y2={centerY + 14}
          stroke={colors.primary}
          strokeWidth={1.5}
        />
      </Svg>

      {/* Progress chips */}
      <View style={styles.chipsRow}>
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <View
              key={step.key}
              style={[
                styles.chip,
                done && styles.chipDone,
                active && styles.chipActive,
              ]}>
              <Text
                style={[
                  styles.chipText,
                  (done || active) && styles.chipTextActive,
                ]}
                numberOfLines={1}>
                {done ? `${step.label} ✓` : step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Guidance banner */}
      <View style={styles.guidanceWrap}>
        <Text style={styles.guidanceTitle}>
          {steps[currentIndex]?.label ?? 'Extra view'}
        </Text>
        <Text style={styles.guidanceText}>{guidance}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipDone: { borderColor: colors.success },
  chipActive: { borderColor: colors.primary, backgroundColor: 'rgba(108,140,255,0.25)' },
  chipText: { ...typography.caption, fontSize: 11 },
  chipTextActive: { color: colors.text },
  guidanceWrap: {
    position: 'absolute',
    bottom: 170,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.overlay,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  guidanceTitle: { ...typography.heading, color: colors.primary },
  guidanceText: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
