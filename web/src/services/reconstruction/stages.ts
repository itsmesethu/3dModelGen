export interface Stage {
  key: string;
  label: string;
}

export const STAGES: Stage[] = [
  { key: 'validate', label: 'Validating Images' },
  { key: 'preprocess', label: 'Preprocessing' },
  { key: 'camera_poses', label: 'Estimating Camera Poses' },
  { key: 'reconstruct', label: 'Reconstructing Geometry' },
  { key: 'mesh_repair', label: 'Repairing Mesh' },
  { key: 'optimize', label: 'Optimizing Mesh' },
  { key: 'texture', label: 'Texturing' },
  { key: 'export', label: 'Exporting Model' },
];
