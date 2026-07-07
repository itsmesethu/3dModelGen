# 3D Scanner Web App

A modern React web application for 3D model generation and visualization. This web app mirrors the functionality of the React Native mobile app, providing a desktop interface for capturing photos and generating 3D models using the Python backend service.

## Features

- **Camera Capture**: Capture photos directly from your webcam with guided capture steps
- **File Upload**: Upload photos from your device's file system
- **Image Validation**: Real-time validation of images before processing
- **Live Progress Tracking**: Monitor the reconstruction pipeline with live stage updates
- **Backend Configuration**: Runtime configuration of the backend service URL
- **Model Visualization**: View generated model metadata and download GLB files
- **Responsive Design**: Beautiful, modern UI built with React, Tailwind CSS, and Lucide icons

## Architecture

### Transport-Agnostic Service

The web app uses an HTTP-based reconstruction service that communicates with the Python backend:

```
Web App (React)
    ↓
ReconstructionService (HTTP)
    ↓
FastAPI Backend
    ↓
Python Engine (reconstruction logic)
```

### Key Components

- **`src/services/reconstruction/`**: HTTP service for communicating with the backend
- **`src/hooks/useGenerateModel.ts`**: Hook for running the reconstruction pipeline
- **`src/store/useCreateStore.ts`**: Zustand store for managing captured images and results
- **`src/screens/`**: Main application screens (Home, Create, Camera, Processing, Result, Visualize)
- **`src/components/`**: Reusable UI components (Button, Card, Modal, ProgressBar, StageList)

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Python backend running (see root README)

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5173` by default.

### Production Build

```bash
npm run build
npm run preview
```

## Configuration

### Backend URL

The app connects to the backend service at `http://localhost:8000` by default. You can configure this at runtime:

1. Click **Backend Connection** on the home screen
2. Enter your backend URL (e.g., `http://192.168.1.100:8000`)
3. Click **Test & Save**

The URL is persisted in localStorage for future sessions.

## Usage

### Creating a 3D Model

1. **Home Screen**: Click "Create 3D" to start
2. **Capture Photos**: 
   - Use your webcam to capture photos from different angles
   - Or upload photos from your device
   - Capture at least 3 images (up to 24)
3. **Review**: Manage and reorder your images
4. **Processing**: Monitor the reconstruction pipeline in real-time
5. **Result**: Download your generated GLB model

### Visualizing Models

1. **Home Screen**: Click "Visualize 3D"
2. **Upload Model**: Select a GLB, GLTF, or OBJ file
3. **View**: Inspect your model in the 3D viewer

## Image Requirements

For best results:

- **Lighting**: Use consistent, even lighting
- **Focus**: Keep the object in sharp focus
- **Framing**: Ensure the object fills most of the frame
- **Angles**: Capture from multiple angles (front, sides, back, top)
- **Background**: Use a contrasting background if possible
- **Quantity**: 3-24 images recommended

## API Integration

The web app communicates with the backend via these endpoints:

- `POST /api/validate` - Validate a single image
- `POST /api/jobs` - Start a reconstruction job
- `GET /api/jobs/{jobId}` - Get job status
- `GET /api/jobs/{jobId}/model` - Download generated model
- `GET /health` - Check backend health

## Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **Axios**: HTTP client
- **Lucide React**: Icons
- **Vite**: Build tool

## Project Structure

```
web/
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── screens/             # Application screens
│   ├── services/            # API and utility services
│   ├── store/               # Zustand stores
│   ├── config.ts            # Configuration
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── tailwind.config.js       # Tailwind config
```

## Development Notes

### State Management

- **`useBackendStore`**: Manages backend URL and connection status
- **`useCreateStore`**: Manages captured images and generated models

### Service Abstraction

The `ReconstructionService` interface allows for different implementations:
- `HttpReconstructionService`: Communicates with FastAPI backend (current)
- Future: Native implementations for desktop/mobile

### Progress Reporting

The reconstruction pipeline reports progress via callbacks:
```typescript
service.generateModel(images, (percent, stageKey) => {
  // Update UI with progress
});
```

## Troubleshooting

### Backend Connection Failed

- Ensure the Python backend is running: `python -m backend.main`
- Check the backend URL in the configuration screen
- Verify network connectivity between web app and backend

### Camera Access Denied

- Grant camera permissions in your browser
- Check browser privacy settings
- Try a different browser if issues persist

### Image Validation Errors

- Ensure images have sufficient resolution (min 640x480)
- Check image brightness and contrast
- Avoid duplicate or very similar images
- Ensure the object is clearly visible

### Processing Fails

- Check backend logs for detailed error messages
- Verify all images are valid and meet requirements
- Try with fewer images (start with 3-5)
- Ensure backend has sufficient disk space

## Future Enhancements

- 3D model preview with Three.js
- Batch processing multiple models
- Model editing and refinement
- Export to additional formats (OBJ, FBX, USDZ)
- Real-time camera calibration feedback
- Advanced image filtering and enhancement

## License

Same as parent project
