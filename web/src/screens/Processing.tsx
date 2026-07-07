import { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import StageList from '../components/StageList';
import { useGenerateModel } from '../hooks/useGenerateModel';
import { useCreateStore } from '../store/useCreateStore';

interface ProcessingProps {
  onNavigate: (screen: string) => void;
}

export default function Processing({ onNavigate }: ProcessingProps) {
  const images = useCreateStore(state => state.images);
  const setGeneratedModel = useCreateStore(state => state.setGeneratedModel);
  const state = useGenerateModel(images);

  useEffect(() => {
    if (state.runState === 'done' && state.result) {
      setGeneratedModel(state.result);
      setTimeout(() => onNavigate('result'), 500);
    }
  }, [state.runState, state.result, setGeneratedModel, onNavigate]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('camera')}
            disabled={state.runState === 'running'}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Processing</h1>
            <p className="text-slate-400">Generating your 3D model...</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <ProgressBar percent={state.percent} label="Overall Progress" />
        </Card>

        {/* Stages */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold mb-4">Pipeline Stages</h2>
          <StageList stages={state.stages} />
        </Card>

        {/* Error */}
        {state.runState === 'failed' && (
          <Card className="mb-6 bg-red-900 border-red-700">
            <p className="text-red-200 font-semibold mb-4">Processing Failed</p>
            <p className="text-red-100 text-sm mb-4">{state.error}</p>
            <button
              onClick={() => onNavigate('camera')}
              className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </Card>
        )}

        {/* Status */}
        <Card>
          <p className="text-slate-300 text-sm">
            {state.runState === 'running' && 'Processing your images...'}
            {state.runState === 'done' && 'Processing complete! Redirecting...'}
            {state.runState === 'failed' && 'An error occurred during processing.'}
            {state.runState === 'starting' && 'Initializing...'}
          </p>
        </Card>
      </div>
    </div>
  );
}
