import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ActionCard from '../../components/common/ActionCard';
import type { RootStackParamList } from '../../navigation/types';
import { useBackendStore } from '../../store/useBackendStore';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { backendUrl, isConnected, loadBackendUrl } = useBackendStore();

  useEffect(() => {
    loadBackendUrl();
  }, [loadBackendUrl]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>3D Scanner</Text>
        <Text style={styles.subtitle}>
          Visualize existing models or create a new one from photos.
        </Text>
        
        <TouchableOpacity
          style={styles.backendButton}
          onPress={() => navigation.navigate('BackendConfig')}>
          <View style={[styles.statusDot, isConnected && styles.statusDotConnected]} />
          <View style={styles.backendTextContainer}>
            <Text style={styles.backendButtonTitle}>Backend Connection</Text>
            <Text style={styles.backendButtonSubtitle}>
              {backendUrl ? `Connected: ${backendUrl}` : 'Not configured - Tap to setup'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.cards}>
        <ActionCard
          icon="🧊"
          title="Visualize 3D"
          subtitle="Open and inspect a GLB, GLTF or OBJ model from your device."
          onPress={() => navigation.navigate('Visualize')}
        />
        <ActionCard
          icon="📸"
          title="Create 3D"
          subtitle="Capture or select photos and generate a new 3D model."
          onPress={() => navigation.navigate('Create3D')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: { marginTop: spacing.xl, marginBottom: spacing.xxl },
  title: { ...typography.title },
  subtitle: { ...typography.body, color: colors.subtext, marginTop: spacing.sm },
  backendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    marginRight: spacing.sm,
  },
  statusDotConnected: {
    backgroundColor: '#4CAF50',
  },
  backendTextContainer: {
    flex: 1,
  },
  backendButtonTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  backendButtonSubtitle: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: 2,
  },
  cards: { gap: spacing.md },
});
