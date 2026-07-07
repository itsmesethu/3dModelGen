import { create } from 'zustand';

import type { GeneratedModel } from '../services/reconstruction';

export interface CapturedImage {
  /** Local file URI (file://...) */
  uri: string;
  /** Guided capture label, e.g. "Front", or "Gallery" */
  label: string;
  fileName: string;
}

interface CreateState {
  images: CapturedImage[];
  /**
   * Result of the last successful `generateModel` call. Kept in the store
   * (rather than navigation params) because it carries a `cleanup()`
   * closure that must not be serialized.
   */
  generatedModel: GeneratedModel | null;
  addImage: (image: CapturedImage) => void;
  replaceImage: (index: number, image: CapturedImage) => void;
  removeImage: (index: number) => void;
  moveImage: (from: number, to: number) => void;
  setGeneratedModel: (model: GeneratedModel | null) => void;
  reset: () => void;
}

export const useCreateStore = create<CreateState>(set => ({
  images: [],
  generatedModel: null,
  addImage: image => set(state => ({ images: [...state.images, image] })),
  replaceImage: (index, image) =>
    set(state => ({
      images: state.images.map((existing, i) => (i === index ? image : existing)),
    })),
  removeImage: index =>
    set(state => ({ images: state.images.filter((_, i) => i !== index) })),
  moveImage: (from, to) =>
    set(state => {
      if (to < 0 || to >= state.images.length) {
        return state;
      }
      const images = [...state.images];
      const [moved] = images.splice(from, 1);
      images.splice(to, 0, moved);
      return { images };
    }),
  setGeneratedModel: generatedModel => set({ generatedModel }),
  reset: () => set({ images: [], generatedModel: null }),
}));
