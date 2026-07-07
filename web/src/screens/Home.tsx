import { useEffect, useState } from 'react';
import { Settings, Box, Camera, X } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useBackendStore } from '../store/useBackendStore';

interface HomeProps {
  onNavigate: (screen: string) => void;
}

interface RecentModel {
  name: string;
  size: number;
  type: string;
  url: string;
  timestamp: number;
  thumbnail?: string;
}

export default function Home({ onNavigate }: HomeProps) {
  const { backendUrl, isConnected, setBackendUrl, testConnection, loadBackendUrl } =
    useBackendStore();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [recentModels, setRecentModels] = useState<RecentModel[]>([]);

  // Generate thumbnail for a model
  const generateThumbnail = async (model: RecentModel): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(200, 200);
        renderer.setPixelRatio(1);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const loader = model.type === '.obj' ? new OBJLoader() : new GLTFLoader();

        loader.load(
          model.url,
          (data: any) => {
            let modelObj = data;
            if (data.scene) {
              modelObj = data.scene;
            }

            const box = new THREE.Box3().setFromObject(modelObj);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 4 / maxDim;

            modelObj.position.sub(center.multiplyScalar(scale));
            modelObj.scale.multiplyScalar(scale);

            scene.add(modelObj);
            renderer.render(scene, camera);

            const thumbnail = canvas.toDataURL('image/png');
            resolve(thumbnail);
          },
          undefined,
          () => {
            resolve('');
          },
        );
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        resolve('');
      }
    });
  };

  useEffect(() => {
    loadBackendUrl();
    testConnection();
    
    // Load recent models from localStorage
    const stored = localStorage.getItem('recentModels');
    if (stored) {
      try {
        const models = JSON.parse(stored);
        // Sort by timestamp descending (most recent first)
        models.sort((a: RecentModel, b: RecentModel) => b.timestamp - a.timestamp);
        setRecentModels(models);

        // Generate thumbnails for models that don't have them
        models.forEach(async (model: RecentModel, index: number) => {
          if (!model.thumbnail) {
            const thumbnail = await generateThumbnail(model);
            if (thumbnail) {
              models[index].thumbnail = thumbnail;
              localStorage.setItem('recentModels', JSON.stringify(models));
              setRecentModels([...models]);
            }
          }
        });
      } catch (error) {
        console.error('Error loading recent models:', error);
      }
    }
  }, [loadBackendUrl, testConnection]);

  const handleDeleteModel = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updated = recentModels.filter((_, i) => i !== index);
    setRecentModels(updated);
    localStorage.setItem('recentModels', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setRecentModels([]);
    localStorage.removeItem('recentModels');
  };

  const handleConfigBackend = async () => {
    if (tempUrl) {
      setBackendUrl(tempUrl);
      setTesting(true);
      const connected = await testConnection();
      setTesting(false);
      if (connected) {
        setShowConfigModal(false);
        setTempUrl('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">3D Scanner</h1>
          <p className="text-slate-400 mb-6">
            Visualize existing models or create a new one from photos.
          </p>

          {/* Backend Status */}
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <div>
                <p className="font-semibold">Backend Connection</p>
                <p className="text-sm text-slate-400">
                  {backendUrl ? `Connected: ${backendUrl}` : 'Not configured'}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setTempUrl(backendUrl || '');
                setShowConfigModal(true);
              }}
            >
              <Settings size={16} className="mr-2 inline" />
              Configure
            </Button>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => onNavigate('visualize')}
          >
            <div className="flex items-center gap-4 mb-4">
              <Box size={32} className="text-blue-400" />
              <div>
                <h2 className="text-xl font-bold">Visualize 3D</h2>
                <p className="text-sm text-slate-400">Open and inspect models</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm">
              Load and inspect GLB, GLTF, or OBJ models from your device.
            </p>
          </Card>

          <Card
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => onNavigate('create')}
          >
            <div className="flex items-center gap-4 mb-4">
              <Camera size={32} className="text-blue-400" />
              <div>
                <h2 className="text-xl font-bold">Create 3D</h2>
                <p className="text-sm text-slate-400">Generate from photos</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm">
              Capture or select photos and generate a new 3D model.
            </p>
          </Card>
        </div>

        {/* Recent Models */}
        {recentModels.length > 0 && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Models</h2>
              <button
                onClick={handleClearAll}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recentModels.map((model, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:border-blue-500 transition-all hover:shadow-lg p-0 overflow-hidden relative group"
                  onClick={() => {
                    // Store the model to load in visualize screen
                    localStorage.setItem('modelToLoad', JSON.stringify(model));
                    onNavigate('visualize');
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div className="w-full aspect-square bg-slate-800 flex items-center justify-center overflow-hidden relative">
                      {model.thumbnail ? (
                        <img
                          src={model.thumbnail}
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-500 text-center">
                          <p className="text-xs">Loading...</p>
                        </div>
                      )}
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteModel(e, index)}
                        className="absolute top-2 right-2 hover:scale-110 transition-transform"
                        title="Delete model"
                      >
                        <X size={18} className="text-white" strokeWidth={3} />
                      </button>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-end">
                      <p className="text-sm font-medium truncate" title={model.name}>
                        {model.name}
                      </p>
                      <p className="text-xs text-slate-400">{model.type.toUpperCase()}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Backend Config Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Configure Backend"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Backend URL
            </label>
            <input
              type="text"
              value={tempUrl}
              onChange={e => setTempUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfigBackend}
              loading={testing}
              className="flex-1"
            >
              Test & Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfigModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
