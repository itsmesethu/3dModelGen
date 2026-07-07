import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import type { CapturedImage } from '../../store/useCreateStore';
import { colors, radii, spacing, typography } from '../../theme';

interface Props {
  images: CapturedImage[];
  onRemove?: (index: number) => void;
  onRetake?: (index: number) => void;
  onMoveLeft?: (index: number) => void;
  onMoveRight?: (index: number) => void;
}

/** Thumbnail grid with remove / retake / reorder controls. */
export default function ImageGrid({
  images,
  onRemove,
  onRetake,
  onMoveLeft,
  onMoveRight,
}: Props) {
  const { width } = useWindowDimensions();
  const tileSize = (width - spacing.md * 2 - spacing.sm * 2) / 2;

  return (
    <View style={styles.grid}>
      {images.map((image, index) => (
        <View key={`${image.uri}-${index}`} style={[styles.tile, { width: tileSize }]}>
          <Image source={{ uri: image.uri }} style={styles.thumbnail} />
          <View style={styles.labelRow}>
            <Text style={styles.indexBadge}>{index + 1}</Text>
            <Text style={styles.label} numberOfLines={1}>
              {image.label}
            </Text>
          </View>
          <View style={styles.actions}>
            {onMoveLeft && (
              <TouchableOpacity
                style={styles.actionButton}
                disabled={index === 0}
                onPress={() => onMoveLeft(index)}>
                <Text style={[styles.actionText, index === 0 && styles.dim]}>◀</Text>
              </TouchableOpacity>
            )}
            {onRetake && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onRetake(index)}>
                <Text style={styles.actionText}>Retake</Text>
              </TouchableOpacity>
            )}
            {onRemove && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onRemove(index)}>
                <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
              </TouchableOpacity>
            )}
            {onMoveRight && (
              <TouchableOpacity
                style={styles.actionButton}
                disabled={index === images.length - 1}
                onPress={() => onMoveRight(index)}>
                <Text
                  style={[
                    styles.actionText,
                    index === images.length - 1 && styles.dim,
                  ]}>
                  ▶
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  thumbnail: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceAlt },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  indexBadge: {
    ...typography.caption,
    color: colors.background,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minWidth: 20,
    textAlign: 'center',
    fontWeight: '700',
    overflow: 'hidden',
  },
  label: { ...typography.caption, flex: 1, color: colors.text },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  actionButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  actionText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  removeText: { color: colors.danger },
  dim: { opacity: 0.3 },
});
