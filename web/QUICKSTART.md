# Web App Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Python backend running on your machine or network
- Modern web browser with camera support (Chrome, Firefox, Edge, Safari)

## Installation & Running

### 1. Install Dependencies

```bash
cd web
npm install
```

This will install all required packages including React, Tailwind CSS, Zustand, and other dependencies.

### 2. Start the Development Server

```bash
npm run dev
```

The app will automatically open in your browser at `http://localhost:5173`.

### 3. Configure Backend Connection

When you first open the app:

1. Click **Backend Connection** on the home screen
2. Enter your backend URL:
   - Local: `http://localhost:8000`
   - Network: `http://<your-ip>:8000`
3. Click **Test & Save**
4. You should see a green status indicator when connected

### 4. Start Creating 3D Models

1. Click **Create 3D** on the home screen
2. Click **Start Capturing** to begin
3. **Capture Photos**:
   - Click **Start Camera** to use your webcam
   - Or click **Upload** to select photos from your device
   - Capture at least 3 images from different angles
4. Click **Continue to Processing**
5. Monitor the pipeline stages in real-time
6. Download your generated GLB model when complete

## Common Issues

### "Cannot connect to backend"

**Solution:**
- Ensure Python backend is running: `python -m backend.main`
- Check the backend URL in the configuration screen
- If running on a different machine, use the machine's IP address instead of localhost

### "Camera access denied"

**Solution:**
- Grant camera permissions when prompted by your browser
- Check browser privacy settings
- Try a different browser

### "Image validation failed"

**Solution:**
- Ensure images are clear and well-lit
- Make sure the object is in focus
- Avoid duplicate or very similar images
- Try uploading different photos

### "Processing failed"

**Solution:**
- Check backend logs for detailed error messages
- Try with fewer images (start with 3-5)
- Ensure backend has sufficient disk space
- Restart the backend service

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint code
npm run lint
```

## Project Structure

```
web/
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── screens/             # Application screens
│   ├── services/            # API and utility services
│   ├── store/               # State management
│   ├── App.tsx              # Main component
│   └── main.tsx             # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Key Features

✅ **Camera Capture** - Use your webcam to capture photos  
✅ **File Upload** - Upload photos from your device  
✅ **Image Validation** - Real-time validation before processing  
✅ **Live Progress** - Monitor reconstruction pipeline  
✅ **Backend Configuration** - Runtime URL configuration  
✅ **Model Download** - Export generated GLB files  
✅ **Responsive Design** - Works on desktop and tablet  

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check the [backend README](../backend/README.md) for backend setup
- Explore the [engine documentation](../engine/README.md) for reconstruction details

## Support

For issues or questions:
1. Check the troubleshooting section in [README.md](./README.md)
2. Review backend logs for errors
3. Ensure all prerequisites are installed
4. Try with a fresh browser session (clear cache)
