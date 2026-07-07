/** Guided capture plan. Order matters — the backend's baseline camera
 * estimator assigns canonical poses following this exact sequence. */
export interface CaptureStep {
  key: string;
  label: string;
  hint: string;
}

export const CAPTURE_STEPS: CaptureStep[] = [
  {
    key: 'front',
    label: 'Front',
    hint: 'Face the object straight on. Keep it inside the silhouette.',
  },
  {
    key: 'front_left',
    label: 'Front Left',
    hint: 'Move slightly left, about 45°, keeping the same distance.',
  },
  {
    key: 'left',
    label: 'Left',
    hint: 'Move to the left side of the object (90°).',
  },
  {
    key: 'back',
    label: 'Back',
    hint: 'Move behind the object. Keep it centered.',
  },
  {
    key: 'right',
    label: 'Right',
    hint: 'Move to the right side of the object (90°).',
  },
  {
    key: 'front_right',
    label: 'Front Right',
    hint: 'Move slightly right of the front, about 45°.',
  },
  {
    key: 'top',
    label: 'Top',
    hint: 'Hold the phone above and angle it down toward the object.',
  },
];

export const CAPTURE_TIPS = [
  'Keep the object inside the silhouette',
  'Move closer if the object looks small',
  'Avoid harsh shadows and reflections',
  'Hold steady to avoid motion blur',
];
