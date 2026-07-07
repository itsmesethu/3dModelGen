import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import PrimaryButton from '../../components/common/PrimaryButton';
import ProgressStepper from '../../components/ProgressStepper/ProgressStepper';
import { useGenerateModel } from '../../hooks/useGenerateModel';
import type { RootStackParamList } from '../../navigation/types';
import { useCreateStore } from '../../store/useCreateStore';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Processing'>;

export default function ProcessingScreen({ navigation }: Props) {
  const images = useCreateStore(state => state.images);
  const setGeneratedModel = useCreateStore(state => state.setGeneratedModel);
  const { runState, percent, stages, error, result } = useGenerateModel(images);
  const [elapsed, setElapsed] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spin]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(seconds => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (runState === 'done' && result) {
      setGeneratedModel(result);
      navigation.replace('Result');
    }
  }, [runState, result, setGeneratedModel, navigation]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressPercent = Math.round(percent);
  const failed = runState === 'failed';

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const elapsedLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
        <Text style={styles.percent}>{progressPercent}%</Text>
        <Text style={styles.stageLabel}>
          {failed
            ? 'Reconstruction failed'
            : stages.find(s => s.state === 'running')?.label ?? 'Preparing…'}
        </Text>
        <Text style={styles.elapsed}>Elapsed {elapsedLabel}</Text>
      </View>

      <View style={styles.stepperWrap}>
        <ProgressStepper stages={stages} />
      </View>

      {failed && (
        <View style={styles.footer}>
          <Text style={styles.errorText}>
            {error ?? 'Something went wrong during reconstruction.'}
          </Text>
          <PrimaryButton label="Back to Review" onPress={() => navigation.goBack()} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  hero: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: colors.border,
    borderTopColor: colors.primary,
    marginBottom: spacing.md,
  },
  percent: { ...typography.title, fontSize: 34 },
  stageLabel: { ...typography.body, color: colors.subtext, marginTop: spacing.xs },
  elapsed: { ...typography.caption, marginTop: spacing.xs },
  stepperWrap: { flex: 1 },
  footer: { gap: spacing.md, paddingTop: spacing.lg },
  errorText: {
    ...typography.body,
    color: colors.danger,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
  },
});
