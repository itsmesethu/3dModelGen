import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';

import { useBackendStore } from '../../store/useBackendStore';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BackendConfig'>;

export default function BackendConfigScreen({ navigation }: Props) {
  const { backendUrl, isConnected, setBackendUrl, setConnected, clearBackendUrl } = useBackendStore();
  const [url, setUrl] = useState(backendUrl || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (backendUrl) {
      setUrl(backendUrl);
    }
  }, [backendUrl]);

  const checkHealth = async (testUrl: string) => {
    try {
      const cleanUrl = testUrl.trim().replace(/\/$/, '');
      const response = await axios.get(`${cleanUrl}/api/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  };

  const handleConnect = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a backend URL');
      return;
    }

    setLoading(true);
    const isHealthy = await checkHealth(url);
    setLoading(false);

    if (isHealthy) {
      const cleanUrl = url.trim().replace(/\/$/, '');
      await setBackendUrl(cleanUrl);
      setConnected(true);
      Alert.alert('Success', 'Connected to backend successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      Alert.alert(
        'Connection Failed',
        'Could not connect to the backend. Please check the URL and try again.',
      );
    }
  };

  const handleDisconnect = async () => {
    await clearBackendUrl();
    setUrl('');
    Alert.alert('Disconnected', 'Backend connection cleared');
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a backend URL');
      return;
    }

    setLoading(true);
    const isHealthy = await checkHealth(url);
    setLoading(false);

    if (isHealthy) {
      Alert.alert('Success', 'Backend is reachable and healthy!');
    } else {
      Alert.alert('Failed', 'Could not reach the backend. Please check the URL.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Backend Configuration</Text>
        <Text style={styles.subtitle}>
          Enter the URL of your backend server. The app will verify the connection before saving.
        </Text>

        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, isConnected && styles.statusDotConnected]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Text>
        </View>

        {backendUrl && (
          <View style={styles.currentUrlContainer}>
            <Text style={styles.currentUrlLabel}>Current URL:</Text>
            <Text style={styles.currentUrl}>{backendUrl}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Backend URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.100:8000"
            placeholderTextColor={colors.subtext}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Example: http://192.168.1.100:8000 or http://your-server-ip:8000
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestConnection}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>Test Connection</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.connectButton]}
            onPress={handleConnect}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, styles.connectButtonText]}>
                Connect & Save
              </Text>
            )}
          </TouchableOpacity>

          {backendUrl && (
            <TouchableOpacity
              style={[styles.button, styles.disconnectButton]}
              onPress={handleDisconnect}
              disabled={loading}>
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.subtext,
    marginBottom: spacing.xl,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
  },
  statusDotConnected: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    ...typography.body,
    color: colors.text,
  },
  currentUrlContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  currentUrlLabel: {
    ...typography.caption,
    color: colors.subtext,
    marginBottom: spacing.xs,
  },
  currentUrl: {
    ...typography.body,
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
  },
  hint: {
    ...typography.caption,
    color: colors.subtext,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  button: {
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  testButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  connectButton: {
    backgroundColor: colors.primary,
  },
  disconnectButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    ...typography.button,
    color: colors.text,
  },
  connectButtonText: {
    color: colors.background,
  },
});
