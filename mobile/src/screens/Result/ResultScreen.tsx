import React, { useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomToolbar from '../../components/BottomToolbar/BottomToolbar';
import ModelViewer, {
  type ModelSource,
  type ModelViewerHandle,
} from '../../components/ModelViewer/ModelViewer';
import PrimaryButton from '../../components/common/PrimaryButton';
import { readFileBase64, saveModelToDevice } from '../../services/downloads';
import type { RootStackParamList } from '../../navigation/types';
import { useCreateStore } from '../../store/useCreateStore';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ navigation }: Props) {
  const generatedModel = useCreateStore(state => state.generatedModel);
  const reset = useCreateStore(state => state.reset);
  const viewerRef = useRef<ModelViewerHandle>(null);

  const [source, setSource] = useState<ModelSource | null>(null);
  const [loadError, setLoadError] = useState<string | null>(
    generatedModel ? null : 'No generated model was found.',
  );
  const [saving, setSaving] = useState(false);
  const [autoRotate, setAutoRotateState] = useState(true);

  useEffect(() => {
    if (!generatedModel) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const base64 = await readFileBase64(generatedModel.modelUri);
        if (cancelled) return;
        setSource({ base64, format: 'glb' });
      } catch (error: any) {
        if (!cancelled) {
          setLoadError(error?.message ?? 'Could not load the generated model.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [generatedModel]);

  useEffect(() => {
    if (source) {
      viewerRef.current?.setAutoRotate(autoRotate);
    }
  }, [source, autoRotate]);

  const handleDownload = async () => {
    if (!generatedModel) {
      return;
    }
    setSaving(true);
    try {
      const savedPath = await saveModelToDevice(
        generatedModel.modelUri,
        `scan_${Date.now()}.glb`,
      );
      Alert.alert('Saved', `Model saved to:\n${savedPath}`);
    } catch (error: any) {
      Alert.alert('Save failed', error?.message ?? 'Could not save the model.');
    } finally {
      setSaving(false);
    }
  };

  const handleDone = () => {
    generatedModel?.cleanup().catch(() => undefined);
    reset();
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.viewerWrap}>
        {loadError ? (
          <View style={styles.centered}>
            <Text style={styles.errorTitle}>Could not load model</Text>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : (
          <ModelViewer
            ref={viewerRef}
            source={source}
            onError={message => setLoadError(message)}
          />
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Generated 3D Model</Text>
        </View>
      </View>

      <View style={styles.downloadWrap}>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Download Model'}
          onPress={handleDownload}
          disabled={!generatedModel || saving}
          loading={saving}
        />
      </View>

      <BottomToolbar
        actions={[
          {
            key: 'reset',
            label: 'Reset Camera',
            onPress: () => viewerRef.current?.resetCamera(),
            disabled: !source,
          },
          {
            key: 'rotate',
            label: autoRotate ? 'Stop Rotate' : 'Auto Rotate',
            onPress: () => setAutoRotateState(current => !current),
            disabled: !source,
          },
          {
            key: 'done',
            label: 'Done',
            onPress: handleDone,
            primary: true,
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  viewerWrap: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorTitle: { ...typography.heading, color: colors.danger },
  errorText: { ...typography.body, color: colors.subtext, marginTop: spacing.sm, textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.overlay,
    borderRadius: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  badgeText: { ...typography.caption, color: colors.text },
  downloadWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
});
