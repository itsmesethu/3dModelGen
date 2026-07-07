/**
 * Canonical pipeline stages — mirror of `shared/contracts/stages.json`
 * (source of truth: engine/engine/models/types.py). Keep in sync.
 */
export interface StageDefinition {
  key: string;
  label: string;
}

export const STAGES: StageDefinition[] = [
  { key: 'preparing', label: 'Preparing' },
  { key: 'validating', label: 'Validating Images' },
  { key: 'background_removal', label: 'Removing Backgrounds' },
  { key: 'camera_estimation', label: 'Estimating Camera Positions' },
  { key: 'reconstruction', label: 'Reconstructing Geometry' },
  { key: 'mesh_repair', label: 'Repairing Mesh' },
  { key: 'texturing', label: 'Applying Texture' },
  { key: 'optimization', label: 'Optimizing Model' },
  { key: 'export', label: 'Exporting Model' },
];
