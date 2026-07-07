import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, Camera as CameraIcon, Upload, ChevronDown } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { useCreateStore } from '../store/useCreateStore';
import { getReconstructionService } from '../services/reconstruction';
import { MIN_IMAGES, MAX_IMAGES } from '../config';

interface CameraCaptureProps {
  onNavigate: (screen: string) => void;
}

const CAPTURE_STEPS = [
  'Front',
  'Front-Left',
  'Left',
  'Back-Left',
  'Back',
  'Back-Right',
  'Right',
  'Front-Right',
];

export default function CameraCapture({ onNavigate }: CameraCaptureProps) {
  const { images, addImage } = useCreateStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Enumerate available cameras on mount
  useEffect(() => {
    const enumerateCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras);
        if (cameras.length > 0) {
          setSelectedCameraId(cameras[0].deviceId);
        }
      } catch (error) {
        console.error('Error enumerating cameras:', error);
      }
    };
    enumerateCameras();
  }, []);

  const currentStep = images.length < CAPTURE_STEPS.length ? CAPTURE_STEPS[images.length] : 'Gallery';

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraLoading(true);
    setCameraActive(true);
    try {
      const constraints: MediaStreamConstraints = {
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      };

      // If a specific camera is selected, use it; otherwise use facing mode
      if (selectedCameraId) {
        (constraints.video as any).deviceId = { exact: selectedCameraId };
      } else {
        (constraints.video as any).facingMode = mode;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error('Play error:', err);
          });
          setCameraLoading(false);
        };
      }
      setFacingMode(mode);
      setValidationError(null);
    } catch (error: any) {
      console.error('Camera error:', error);
      setValidationError(`Camera error: ${error.message || 'Unable to access camera'}`);
      setCameraActive(false);
      setCameraLoading(false);
    }
  };

  const flipCamera = () => {
    if (videoRef.current) {
      videoRef.current.style.transform = 
        videoRef.current.style.transform === 'scaleX(-1)' 
          ? 'scaleX(1)' 
          : 'scaleX(-1)';
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    const imageUri = canvasRef.current.toDataURL('image/jpeg');
    await validateAndAddImage(imageUri, currentStep);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = async e => {
        const imageUri = e.target?.result as string;
        await validateAndAddImage(imageUri, 'Gallery');
      };
      reader.readAsDataURL(file);
    }
  };

  const validateAndAddImage = async (imageUri: string, label: string) => {
    setValidating(true);
    setValidationError(null);

    try {
      const service = await getReconstructionService();
      const validation = await service.validateImage(imageUri);

      if (!validation.valid) {
        setValidationError(`Image validation failed: ${validation.issues.join(', ')}`);
        setValidating(false);
        return;
      }

      addImage({
        uri: imageUri,
        label,
        fileName: `${label}-${Date.now()}.jpg`,
      });

      // Keep camera running for continuous capture
      setValidationError(null);
    } catch (error: any) {
      setValidationError(error?.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const canContinue = images.length >= MIN_IMAGES;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('create')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Capture Photos</h1>
            <p className="text-slate-400">
              {images.length} / {MAX_IMAGES} images
            </p>
          </div>
        </div>

        {/* Camera Preview */}
        {cameraActive && (
          <Card className="mb-6 p-0 overflow-hidden">
            <div className="relative w-full bg-black" style={{ height: '500px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {cameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <p className="text-slate-300 text-lg">Starting camera...</p>
                </div>
              )}
              
              {/* Blue border overlay */}
              <div className="absolute inset-0 border-4 border-blue-500 pointer-events-none" />
              
              {/* Camera Controls at Bottom */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-4">
                {/* Flip Camera Button */}
                <button
                  onClick={() => flipCamera()}
                  disabled={validating || cameraLoading}
                  className="w-12 h-12 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-full flex items-center justify-center transition-all shadow-lg"
                  title="Flip camera"
                >
                  <span className="text-white font-bold text-lg">F</span>
                </button>

                {/* Shutter Button */}
                <button
                  onClick={capturePhoto}
                  disabled={validating || cameraLoading}
                  className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 hover:bg-slate-100 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center"
                  title="Capture photo"
                >
                  <div className="w-12 h-12 bg-slate-400 rounded-full" />
                </button>
              </div>

              {/* Cancel Button */}
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors z-10"
              >
                Cancel
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </Card>
        )}

        {/* Camera Controls */}
        {!cameraActive && (
          <Card className="mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Next capture:</p>
                <p className="text-lg font-semibold text-blue-400">{currentStep}</p>
              </div>

              {/* Camera Selection Dropdown */}
              {availableCameras.length > 1 && (
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Select Camera:</label>
                  <div className="relative">
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      {availableCameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => startCamera()}
                  disabled={images.length >= MAX_IMAGES}
                  className="flex-1"
                >
                  <CameraIcon size={16} className="mr-2 inline" />
                  Start Camera
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= MAX_IMAGES}
                  className="flex-1"
                >
                  <Upload size={16} className="mr-2 inline" />
                  Upload
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </Card>
        )}

        {/* Validation Error */}
        {validationError && (
          <Card className="mb-6 bg-red-900 border-red-700">
            <p className="text-red-200">{validationError}</p>
          </Card>
        )}

        {/* Captured Images */}
        {images.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-bold mb-4">Captured Images ({images.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.uri}
                    alt={img.label}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                    <button
                      onClick={() => {
                        const newImages = images.filter((_, i) => i !== idx);
                        useCreateStore.setState({ images: newImages });
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm font-medium transition-all"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-center">{img.label}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Continue Button */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => onNavigate('processing')}
            disabled={!canContinue}
            className="flex-1"
          >
            Continue to Processing
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('create')}
            className="flex-1"
          >
            Back
          </Button>
        </div>

        {!canContinue && (
          <p className="text-center text-slate-400 text-sm mt-4">
            Capture at least {MIN_IMAGES} images to continue
          </p>
        )}
      </div>
    </div>
  );
}
