import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

/**
 * Save a cached model to the device using the platform's recommended
 * location (Downloads on Android, Documents on iOS).
 * Returns the absolute path of the saved file.
 */
export async function saveModelToDevice(
  cachedFileUri: string,
  fileName = `scan_${Date.now()}.glb`,
): Promise<string> {
  const source = cachedFileUri.replace('file://', '');
  const directory =
    Platform.OS === 'android'
      ? RNFS.DownloadDirectoryPath
      : RNFS.DocumentDirectoryPath;
  const destination = `${directory}/${fileName}`;
  await RNFS.copyFile(source, destination);
  return destination;
}

/** Read any local file as base64 (used to feed models into the viewer). */
export async function readFileBase64(uri: string): Promise<string> {
  const path = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
  return RNFS.readFile(path, 'base64');
}
