import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ImageGrid from '../../components/ImageGrid/ImageGrid';
import PrimaryButton from '../../components/common/PrimaryButton';
import { MAX_IMAGES, MIN_IMAGES } from '../../config';
import type { RootStackParamList } from '../../navigation/types';
import { pickImagesFromGallery } from '../../services/filePicker';
import { useCreateStore } from '../../store/useCreateStore';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ImageReview'>;

export default function ImageReviewScreen({ navigation }: Props) {
  const images = useCreateStore(state => state.images);
  const removeImage = useCreateStore(state => state.removeImage);
  const moveImage = useCreateStore(state => state.moveImage);
  const addImage = useCreateStore(state => state.addImage);

  const canStart = images.length >= MIN_IMAGES;

  const handleAddMore = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    const picked = await pickImagesFromGallery(MAX_IMAGES - images.length);
    picked.forEach((image, index) =>
      addImage({
        uri: image.uri,
        label: `Extra ${images.length + index + 1}`,
        fileName: image.fileName,
      }),
    );
  };

  const handleRetake = (index: number) => {
    navigation.navigate('Camera', { retakeIndex: index });
  };

  const handleStart = () => {
    if (!canStart) {
      Alert.alert(
        'More images needed',
        `Add at least ${MIN_IMAGES} images before starting reconstruction.`,
      );
      return;
    }
    navigation.navigate('Processing');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Review Images</Text>
        <Text style={styles.subtitle}>
          {images.length} image{images.length === 1 ? '' : 's'} ready. Retake, remove
          or reorder before starting.
        </Text>

        {images.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No images yet. Add some to continue.</Text>
          </View>
        ) : (
          <ImageGrid
            images={images}
            onRemove={removeImage}
            onRetake={handleRetake}
            onMoveLeft={index => moveImage(index, index - 1)}
            onMoveRight={index => moveImage(index, index + 1)}
          />
        )}

        <View style={styles.addMoreWrap}>
          <PrimaryButton label="Add More Images" onPress={handleAddMore} variant="secondary" />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={`Start 3D Generation${canStart ? '' : ` (need ${MIN_IMAGES - images.length} more)`}`}
          onPress={handleStart}
          disabled={!canStart}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.title, fontSize: 24 },
  subtitle: { ...typography.body, color: colors.subtext, marginTop: spacing.xs, marginBottom: spacing.lg },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.subtext },
  addMoreWrap: { marginTop: spacing.lg },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
