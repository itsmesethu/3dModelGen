import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Upload } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import Button from '../components/Button';
import Card from '../components/Card';

interface VisualizeProps {
  onNavigate: (screen: string) => void;
}

interface LoadedModel {
  name: string;
  size: number;
  type: string;
  url: string;
}

export default function Visualize({ onNavigate }: VisualizeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [loadedModel, setLoadedModel] = useState<LoadedModel | null>(null);

  // Load model from localStorage if it exists
  useEffect(() => {
    const stored = localStorage.getItem('modelToLoad');
    if (stored) {
      try {
        const model = JSON.parse(stored);
        setLoadedModel(model);
        localStorage.removeItem('modelToLoad');

        // Update timestamp and move to front in recent models
        const recentModels = JSON.parse(localStorage.getItem('recentModels') || '[]');
        const existingIndex = recentModels.findIndex((m: any) => m.url === model.url);
        
        if (existingIndex !== -1) {
          recentModels[existingIndex].timestamp = Date.now();
          const updated = recentModels.splice(existingIndex, 1)[0];
          recentModels.unshift(updated);
          localStorage.setItem('recentModels', JSON.stringify(recentModels.slice(0, 10)));
        }
      } catch (error) {
        console.error('Error loading model from storage:', error);
      }
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!loadedModel || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let modelRotation = { x: 0, y: 0 };
    let model: any = null;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !model) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      modelRotation.y += deltaX * 0.01;
      modelRotation.x += deltaY * 0.01;

      model.rotation.x = modelRotation.x;
      model.rotation.y = modelRotation.y;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);

    // Load model
    const loader = loadedModel.type === '.obj' ? new OBJLoader() : new GLTFLoader();

    loader.load(
      loadedModel.url,
      (data: any) => {
        model = data;
        if (data.scene) {
          model = data.scene;
        }

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4 / maxDim;

        model.position.sub(center.multiplyScalar(scale));
        model.scale.multiplyScalar(scale);

        scene.add(model);

        // Render loop
        const animate = () => {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();
      },
      undefined,
      (error: any) => {
        console.error('Error loading model:', error);
        alert('Error loading model. Please try another file.');
      },
    );

    // Handle window resize
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || width;
      const newHeight = containerRef.current?.clientHeight || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      renderer.dispose();
    };
  }, [loadedModel]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ['.glb', '.gltf', '.obj'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(fileExtension)) {
      alert('Invalid file format. Please upload a GLB, GLTF, or OBJ file.');
      return;
    }

    const url = URL.createObjectURL(file);
    const modelData = {
      name: file.name,
      size: file.size,
      type: fileExtension,
      url,
      timestamp: Date.now(),
    };

    setLoadedModel(modelData);

    // Save to localStorage
    const recentModels = JSON.parse(localStorage.getItem('recentModels') || '[]');
    
    // Check if model already exists by URL
    const existingIndex = recentModels.findIndex((m: any) => m.url === modelData.url);
    
    if (existingIndex !== -1) {
      // Update existing model's timestamp and move to front
      recentModels[existingIndex].timestamp = Date.now();
      const updated = recentModels.splice(existingIndex, 1)[0];
      recentModels.unshift(updated);
    } else {
      // Add new model to front
      recentModels.unshift(modelData);
    }
    
    // Keep only last 10 models
    localStorage.setItem('recentModels', JSON.stringify(recentModels.slice(0, 10)));

    console.log('Model loaded:', modelData);
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
            <h1 className="text-3xl font-bold">Visualize 3D Model</h1>
            <p className="text-slate-400">Load and inspect 3D models from your device</p>
          </div>
        </div>

        {/* Upload Area */}
        {!loadedModel && (
          <Card
            className="mb-6 border-2 border-dashed border-slate-600 hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center py-12">
              <Upload size={48} className="mx-auto mb-4 text-slate-400" />
              <h2 className="text-xl font-bold mb-2">Upload 3D Model</h2>
              <p className="text-slate-400 mb-4">
                Drag and drop or click to select a GLB, GLTF, or OBJ file
              </p>
              <Button variant="primary">Select File</Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,.obj"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Card>
        )}

        {/* Model Preview Area */}
        {loadedModel && (
          <Card className="mb-6">
            <h3 className="font-bold mb-4">3D Preview</h3>
            <div
              ref={containerRef}
              className="bg-black rounded-lg w-full aspect-video"
              style={{ width: '100%', height: '400px' }}
            />
          </Card>
        )}

        {/* Supported Formats */}
        {!loadedModel && (
          <Card>
            <h3 className="font-bold mb-3">Supported Formats</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <span className="font-semibold text-blue-400">GLB</span> - Binary glTF format
                (recommended)
              </li>
              <li>
                <span className="font-semibold text-blue-400">GLTF</span> - Text-based glTF format
              </li>
              <li>
                <span className="font-semibold text-blue-400">OBJ</span> - Wavefront OBJ format
              </li>
            </ul>
          </Card>
        )}

      </div>
    </div>
  );
}
