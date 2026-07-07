import React, { useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BottomToolbar from '../../components/BottomToolbar/BottomToolbar';
import ModelViewer, {
  type ModelSource,
  type ModelViewerHandle,
} from '../../components/ModelViewer/ModelViewer';
import { readFileBase64 } from '../../services/downloads';
import { pickModelFile, UnsupportedModelError } from '../../services/filePicker';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Visualize'>;

export default function VisualizeScreen(_props: Props) {
  const viewerRef = useRef<ModelViewerHandle>(null);
  const [source, setSource] = useState<ModelSource | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoRotate, setAutoRotateState] = useState(false);

  const handleSelectFile = async () => {
    try {
      setBusy(true);
      const picked = await pickModelFile();
      if (!picked) {
        return;
      }
      const base64 = await readFileBase64(picked.uri);
      setSource({ base64, format: picked.format });
      setFileName(picked.name);
    } catch (error) {
      const message =
        error instanceof UnsupportedModelError
          ? error.message
          : 'Could not read the selected file.';
      Alert.alert('Unable to load model', message);
    } finally {
      setBusy(false);
    }
  };

  const toggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotateState(next);
    viewerRef.current?.setAutoRotate(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.viewerWrap}>
        {source ? (
          <ModelViewer
            ref={viewerRef}
            source={source}
            onError={message => Alert.alert('Could not load model', message)}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No model loaded</Text>
            <Text style={styles.emptySubtitle}>
              Select a GLB, GLTF or OBJ file to preview it here.
            </Text>
          </View>
        )}
        {fileName && (
          <View style={styles.fileBadge}>
            <Text style={styles.fileBadgeText} numberOfLines={1}>
              {fileName}
            </Text>
          </View>
        )}
      </View>
      <BottomToolbar
        actions={[
          {
            key: 'select',
            label: busy ? 'Loading…' : 'Select File',
            onPress: handleSelectFile,
            primary: true,
            disabled: busy,
          },
          {
            key: 'reset',
            label: 'Reset Camera',
            onPress: () => viewerRef.current?.resetCamera(),
            disabled: !source,
          },
          {
            key: 'rotate',
            label: autoRotate ? 'Stop Rotate' : 'Auto Rotate',
            onPress: toggleAutoRotate,
            disabled: !source,
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  viewerWrap: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: { ...typography.heading },
  emptySubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  fileBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.overlay,
    borderRadius: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  fileBadgeText: { ...typography.caption, color: colors.text },
});
