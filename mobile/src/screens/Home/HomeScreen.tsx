import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ActionCard from '../../components/common/ActionCard';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>3D Scanner</Text>
        <Text style={styles.subtitle}>
          Visualize existing models or create a new one from photos.
        </Text>
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
  cards: { gap: spacing.md },
});
