import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ActionCard from '../../components/common/ActionCard';
import { MAX_IMAGES } from '../../config';
import type { RootStackParamList } from '../../navigation/types';
import { pickImagesFromGallery } from '../../services/filePicker';
import { useCreateStore } from '../../store/useCreateStore';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Create3D'>;

export default function Create3DScreen({ navigation }: Props) {
  const [busy, setBusy] = useState(false);
  const reset = useCreateStore(state => state.reset);
  const addImage = useCreateStore(state => state.addImage);

  const handleCapture = () => {
    reset();
    navigation.navigate('Camera');
  };

  const handleGallery = async () => {
    try {
      setBusy(true);
      const picked = await pickImagesFromGallery(MAX_IMAGES);
      if (picked.length === 0) {
        return;
      }
      reset();
      picked.forEach((image, index) =>
        addImage({ uri: image.uri, label: `Gallery ${index + 1}`, fileName: image.fileName }),
      );
      navigation.navigate('ImageReview');
    } catch {
      Alert.alert('Error', 'Could not access the gallery.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create 3D Model</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to provide photos of your object.
        </Text>
      </View>
      <View style={styles.cards}>
        <ActionCard
          icon="📷"
          title="Capture Images"
          subtitle="Use a guided camera experience to capture all required angles."
          onPress={handleCapture}
        />
        <ActionCard
          icon="🖼️"
          title="Select Existing Images"
          subtitle={busy ? 'Opening gallery…' : 'Choose multiple photos from your gallery.'}
          onPress={handleGallery}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: { marginTop: spacing.lg, marginBottom: spacing.xl },
  title: { ...typography.title, fontSize: 24 },
  subtitle: { ...typography.body, color: colors.subtext, marginTop: spacing.sm },
  cards: { gap: spacing.md },
});
