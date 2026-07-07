import { useEffect, useRef } from 'react';
import { ChevronLeft, Download } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { useCreateStore } from '../store/useCreateStore';
import { saveModel } from '../services/downloads';

interface ResultProps {
  onNavigate: (screen: string) => void;
}

export default function Result({ onNavigate }: ResultProps) {
  const generatedModel = useCreateStore(state => state.generatedModel);
  const reset = useCreateStore(state => state.reset);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!generatedModel || !canvasRef.current) return;

    // Simple GLB preview - display metadata and provide download
    // Full 3D preview would require Three.js integration
  }, [generatedModel]);

  if (!generatedModel) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Card>
          <p className="text-slate-300">No model generated. Please try again.</p>
          <Button
            variant="primary"
            onClick={() => onNavigate('home')}
            className="mt-4 w-full"
          >
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    saveModel(generatedModel.glbData, `3d-model-${timestamp}.glb`);
  };

  const handleCreateNew = () => {
    reset();
    onNavigate('create');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Model Generated</h1>
            <p className="text-slate-400">Your 3D model is ready!</p>
          </div>
        </div>

        {/* Model Info */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">Model Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Generated At:</span>
              <span className="text-white font-medium">
                {new Date(generatedModel.metadata.generatedAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Images Used:</span>
              <span className="text-white font-medium">{generatedModel.metadata.imageCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Processing Time:</span>
              <span className="text-white font-medium">
                {generatedModel.metadata.processingTimeSeconds.toFixed(1)}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Engine:</span>
              <span className="text-white font-medium">{generatedModel.metadata.engine}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Geometry Backend:</span>
              <span className="text-white font-medium">
                {generatedModel.metadata.geometryBackend}
              </span>
            </div>
          </div>
        </Card>

        {/* Preview Canvas */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold mb-4">3D Preview</h2>
          <canvas
            ref={canvasRef}
            className="w-full bg-black rounded-lg aspect-video"
          />
          <p className="text-slate-400 text-sm mt-2">
            Download the model to view in a 3D viewer (Babylon.js, Three.js, etc.)
          </p>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button variant="primary" onClick={handleDownload} className="w-full">
            <Download size={16} className="mr-2 inline" />
            Download GLB
          </Button>
          <Button variant="secondary" onClick={handleCreateNew} className="w-full">
            Create Another
          </Button>
        </div>

        {/* Back to Home */}
        <Button
          variant="secondary"
          onClick={() => onNavigate('home')}
          className="w-full"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
