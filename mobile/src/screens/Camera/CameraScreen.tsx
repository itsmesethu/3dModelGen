import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

import CameraOverlay from '../../components/CameraOverlay/CameraOverlay';
import { CAPTURE_STEPS, CAPTURE_TIPS } from '../../services/camera/captureGuide';
import { getReconstructionService } from '../../services/reconstruction';
import type { RootStackParamList } from '../../navigation/types';
import { useCreateStore } from '../../store/useCreateStore';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export default function CameraScreen({ navigation, route }: Props) {
  const retakeIndex = route.params?.retakeIndex;
  const isRetake = retakeIndex !== undefined;

  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const images = useCreateStore(state => state.images);
  const addImage = useCreateStore(state => state.addImage);
  const replaceImage = useCreateStore(state => state.replaceImage);

  const [stepIndex, setStepIndex] = useState(
    isRetake ? retakeIndex! : images.length,
  );
  const [capturing, setCapturing] = useState(false);
  const [guidance, setGuidance] = useState('Keep the object inside the silhouette');
  const [tipCycle, setTipCycle] = useState(0);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (isRetake) {
      return;
    }
    const timer = setInterval(() => {
      setTipCycle(current => (current + 1) % CAPTURE_TIPS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isRetake]);

  useEffect(() => {
    if (!isRetake) {
      setGuidance(CAPTURE_TIPS[tipCycle]);
    }
  }, [tipCycle, isRetake]);

  const currentStep =
    CAPTURE_STEPS[Math.min(stepIndex, CAPTURE_STEPS.length - 1)] ?? {
      key: `extra_${stepIndex}`,
      label: `Extra angle ${stepIndex + 1 - CAPTURE_STEPS.length}`,
      hint: 'Capture another angle to improve reconstruction quality.',
    };

  const goToReviewOrNext = useCallback(
    (nextIndex: number) => {
      if (isRetake) {
        navigation.navigate('ImageReview');
        return;
      }
      if (nextIndex >= CAPTURE_STEPS.length) {
        navigation.navigate('ImageReview');
      } else {
        setStepIndex(nextIndex);
      }
    },
    [isRetake, navigation],
  );

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) {
      return;
    }
    setCapturing(true);
    setGuidance('Checking image quality…');
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      const uri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const fileName = `${currentStep.key}_${Date.now()}.jpg`;

      const service = await getReconstructionService();
      const validation = await service.validateImage({ uri, label: currentStep.label, fileName });
      if (validation && !validation.ok) {
        setGuidance(validation.reasons[0] ?? 'Please retake this photo.');
        Alert.alert('Retake needed', validation.reasons.join('\n'));
        return;
      }

      const captured = { uri, label: currentStep.label, fileName };
      if (isRetake) {
        replaceImage(retakeIndex!, captured);
      } else {
        addImage(captured);
      }
      setGuidance('Good position — captured!');
      goToReviewOrNext(stepIndex + 1);
    } catch (error) {
      Alert.alert('Capture failed', 'Could not take the photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>Camera permission is required to capture images.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.permissionText}>Looking for a camera…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />
      <CameraOverlay
        steps={CAPTURE_STEPS}
        currentIndex={Math.min(stepIndex, CAPTURE_STEPS.length - 1)}
        guidance={isRetake ? currentStep.hint : guidance}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, capturing && styles.captureButtonBusy]}
          onPress={handleCapture}
          disabled={capturing}>
          {capturing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <View style={styles.captureInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.retakeButton}
          disabled={images.length === 0}
          onPress={() => navigation.navigate('ImageReview')}>
          <Text
            style={[
              styles.retakeText,
              images.length === 0 && styles.retakeTextDisabled,
            ]}>
            Review ({images.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionText: { ...typography.body, textAlign: 'center' },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  permissionButtonText: { ...typography.button, color: '#0B0D12' },
  bottomBar: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  captureButtonBusy: { opacity: 0.7 },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  cancelButton: { padding: spacing.sm, width: 90 },
  cancelText: { ...typography.body, color: '#fff' },
  retakeButton: { padding: spacing.sm, width: 90, alignItems: 'flex-end' },
  retakeText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  retakeTextDisabled: { color: 'rgba(255,255,255,0.35)' },
});
