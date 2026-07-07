import { ChevronLeft, Camera, Upload } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { useCreateStore } from '../store/useCreateStore';
import { MIN_IMAGES, MAX_IMAGES } from '../config';

interface CreateProps {
  onNavigate: (screen: string) => void;
}

export default function Create({ onNavigate }: CreateProps) {
  const images = useCreateStore(state => state.images);
  const reset = useCreateStore(state => state.reset);

  const handleStart = () => {
    reset();
    onNavigate('camera');
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
            <h1 className="text-3xl font-bold">Create 3D Model</h1>
            <p className="text-slate-400">Capture or upload photos to generate a 3D model</p>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          <ol className="space-y-3 text-slate-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>Capture or upload {MIN_IMAGES}-{MAX_IMAGES} photos of your object</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>Take photos from different angles around the object</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>Ensure good lighting and focus on the object</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>Review and process your images to generate the 3D model</span>
            </li>
          </ol>
        </Card>

        {/* Tips */}
        <Card className="mb-6 bg-blue-900 border-blue-700">
          <h3 className="font-bold text-blue-200 mb-3">Tips for Best Results</h3>
          <ul className="space-y-2 text-blue-100 text-sm">
            <li>• Use consistent lighting throughout all photos</li>
            <li>• Keep the object in focus and well-framed</li>
            <li>• Capture the object from multiple angles (front, sides, back, top)</li>
            <li>• Avoid shadows and reflections on the object</li>
            <li>• Use a contrasting background if possible</li>
          </ul>
        </Card>

        {/* Current Status */}
        {images.length > 0 && (
          <Card className="mb-6">
            <h3 className="font-bold mb-2">Current Progress</h3>
            <p className="text-slate-300">
              {images.length} / {MAX_IMAGES} images captured
            </p>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${(images.length / MAX_IMAGES) * 100}%` }}
              />
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="primary" onClick={handleStart} className="w-full">
            <Camera size={16} className="mr-2 inline" />
            {images.length > 0 ? 'Continue Capturing' : 'Start Capturing'}
          </Button>
          {images.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => onNavigate('camera')}
              className="w-full"
            >
              <Upload size={16} className="mr-2 inline" />
              Review & Manage Images
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
