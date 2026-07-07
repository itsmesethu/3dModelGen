import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { launchImageLibrary } from 'react-native-image-picker';

export type ModelFormat = 'glb' | 'gltf' | 'obj';

export interface PickedModel {
  uri: string;
  name: string;
  format: ModelFormat;
}

export interface PickedImage {
  uri: string;
  fileName: string;
}

/** Formats the viewer currently understands. Extend this map to add more. */
const SUPPORTED_MODEL_EXTENSIONS: Record<string, ModelFormat> = {
  glb: 'glb',
  gltf: 'gltf',
  obj: 'obj',
};

export class UnsupportedModelError extends Error {
  constructor(name: string) {
    super(
      `"${name}" is not a supported model. Use GLB, GLTF or OBJ files.`,
    );
    this.name = 'UnsupportedModelError';
  }
}

/** Open the document picker and return a supported 3D model, or null if cancelled. */
export async function pickModelFile(): Promise<PickedModel | null> {
  try {
    const [result] = await pick({ type: [types.allFiles], copyTo: undefined });
    const name = result.name ?? 'model';
    const extension = name.split('.').pop()?.toLowerCase() ?? '';
    const format = SUPPORTED_MODEL_EXTENSIONS[extension];
    if (!format) {
      throw new UnsupportedModelError(name);
    }
    return { uri: result.uri, name, format };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    throw error;
  }
}

/** Pick multiple photos from the gallery. Returns [] if cancelled. */
export async function pickImagesFromGallery(limit: number): Promise<PickedImage[]> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: limit,
    quality: 0.9,
  });
  if (result.didCancel || !result.assets) {
    return [];
  }
  return result.assets
    .filter(asset => !!asset.uri)
    .map((asset, index) => ({
      uri: asset.uri as string,
      fileName: asset.fileName ?? `gallery_${Date.now()}_${index}.jpg`,
    }));
}
