import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { colors, spacing, typography } from '../../theme';
import { VIEWER_HTML } from './viewerHtml';

export interface ModelSource {
  base64: string;
  format: 'glb' | 'gltf' | 'obj';
}

export interface ModelViewerHandle {
  resetCamera: () => void;
  setAutoRotate: (enabled: boolean) => void;
}

interface Props {
  source: ModelSource | null;
  onLoaded?: () => void;
  onError?: (message: string) => void;
}

/**
 * Reusable 3D viewer (rotate / zoom / pan via OrbitControls).
 * Used by both the Visualize flow and the generation Result screen.
 */
const ModelViewer = forwardRef<ModelViewerHandle, Props>(
  ({ source, onLoaded, onError }, ref) => {
    // Note: the explicit <object> generic works around a react-native-webview
    // v14 typing bug where the default P=undefined collapses props to `never`.
    const webviewRef = useRef<WebView<object>>(null);
    const [viewerReady, setViewerReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const post = useCallback((payload: object) => {
      webviewRef.current?.postMessage(JSON.stringify(payload));
    }, []);

    useImperativeHandle(ref, () => ({
      resetCamera: () => post({ type: 'reset' }),
      setAutoRotate: (enabled: boolean) => post({ type: 'autorotate', enabled }),
    }));

    useEffect(() => {
      if (viewerReady && source) {
        setLoading(true);
        setError(null);
        post({ type: 'load', format: source.format, base64: source.base64 });
      }
    }, [viewerReady, source, post]);

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        let message: { type: string; message?: string };
        try {
          message = JSON.parse(event.nativeEvent.data);
        } catch {
          return;
        }
        if (message.type === 'ready') {
          setViewerReady(true);
        } else if (message.type === 'loaded') {
          setLoading(false);
          onLoaded?.();
        } else if (message.type === 'error') {
          setLoading(false);
          setError(message.message ?? 'Failed to load the model.');
          onError?.(message.message ?? 'Failed to load the model.');
        }
      },
      [onLoaded, onError],
    );

    return (
      <View style={styles.container}>
        <WebView<object>
          ref={webviewRef}
          source={{ html: VIEWER_HTML, baseUrl: 'https://localhost' }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          onMessage={handleMessage}
          setBuiltInZoomControls={false}
          overScrollMode="never"
          bounces={false}
        />
        {loading && (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.overlayText}>Loading model…</Text>
          </View>
        )}
        {error && (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.errorTitle}>Could not load model</Text>
            <Text style={styles.overlayText}>{error}</Text>
          </View>
        )}
      </View>
    );
  },
);

ModelViewer.displayName = 'ModelViewer';
export default ModelViewer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  webview: { flex: 1, backgroundColor: colors.background },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.lg,
  },
  overlayText: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorTitle: { ...typography.heading, color: colors.danger },
});
