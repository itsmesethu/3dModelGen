import { useEffect, useRef, useState } from 'react';
import type { GeneratedModel } from '../services/reconstruction';
import { getReconstructionService, STAGES } from '../services/reconstruction';
import type { StageState, StageStatus } from '../services/reconstruction/types';
import type { CapturedImage } from '../store/useCreateStore';

export type RunState = 'starting' | 'running' | 'done' | 'failed';

interface State {
  runState: RunState;
  percent: number;
  stageKey: string;
  stages: StageStatus[];
  error: string | null;
  result: GeneratedModel | null;
}

function deriveStages(currentKey: string, failed: boolean): StageStatus[] {
  const currentIndex = STAGES.findIndex(stage => stage.key === currentKey);
  return STAGES.map((stage, index) => {
    let state: StageState = 'waiting';
    if (failed && index === currentIndex) {
      state = 'failed';
    } else if (index < currentIndex) {
      state = 'done';
    } else if (index === currentIndex) {
      state = 'running';
    }
    return { key: stage.key, label: stage.label, state };
  });
}

const INITIAL_STATE: State = {
  runState: 'starting',
  percent: 0,
  stageKey: STAGES[0].key,
  stages: deriveStages(STAGES[0].key, false),
  error: null,
  result: null,
};

/**
 * Runs the reconstruction pipeline through the HTTP service
 * and exposes live progress via callbacks.
 */
export function useGenerateModel(images: CapturedImage[]) {
  const [state, setState] = useState<State>(INITIAL_STATE);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const service = await getReconstructionService();
        setState(current => ({ ...current, runState: 'running' }));

        const result = await service.generateModel(images, (percent, stageKey) => {
          if (cancelled) return;
          setState(current => ({
            ...current,
            percent,
            stageKey,
            stages: deriveStages(stageKey, false),
          }));
        });

        if (cancelled) return;
        setState(current => ({
          ...current,
          runState: 'done',
          percent: 100,
          stages: deriveStages('export', false),
          result,
        }));
      } catch (error: any) {
        if (cancelled) return;
        setState(current => ({
          ...current,
          runState: 'failed',
          error: error?.message ?? 'Reconstruction failed. Please try again.',
          stages: deriveStages(current.stageKey, true),
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
