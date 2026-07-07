# Web App Setup & Deployment Guide

## Complete Setup Instructions

### Step 1: Install Dependencies

```bash
cd web
npm install
```

This installs all required packages:
- React 18 & React DOM
- TypeScript
- Tailwind CSS & PostCSS
- Zustand (state management)
- Axios (HTTP client)
- Lucide React (icons)
- Vite (build tool)
- ESLint & related tools

**Expected time**: 2-5 minutes depending on internet speed

### Step 2: Verify Backend is Running

Ensure the Python backend is running:

```bash
# In a separate terminal, from the project root
python -m backend.main
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Start Development Server

```bash
npm run dev
```

The app will automatically open at `http://localhost:5173`.

### Step 4: Configure Backend Connection

1. On the home screen, click **Backend Connection**
2. Enter the backend URL:
   - **Local**: `http://localhost:8000`
   - **Network**: `http://<your-machine-ip>:8000`
3. Click **Test & Save**
4. Verify the status indicator turns green

## Running the Application

### Development Mode

```bash
npm run dev
```

- Hot module reloading enabled
- Source maps for debugging
- Runs on `http://localhost:5173`

### Production Build

```bash
npm run build
```

Creates optimized build in `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing.

## Project Layout

```
web/
├── src/
│   ├── App.tsx                          # Main app router
│   ├── main.tsx                         # Entry point
│   ├── config.ts                        # Configuration constants
│   ├── index.css                        # Global styles
│   │
│   ├── components/                      # Reusable UI components
│   │   ├── Button.tsx                   # Button with variants
│   │   ├── Card.tsx                     # Card container
│   │   ├── Modal.tsx                    # Modal dialog
│   │   ├── ProgressBar.tsx              # Progress visualization
│   │   └── StageList.tsx                # Pipeline stages
│   │
│   ├── screens/                         # Application screens
│   │   ├── Home.tsx                     # Home/navigation
│   │   ├── Create.tsx                   # Create workflow intro
│   │   ├── CameraCapture.tsx            # Camera & upload
│   │   ├── Processing.tsx               # Progress tracking
│   │   ├── Result.tsx                   # Model result
│   │   └── Visualize.tsx                # Model viewer
│   │
│   ├── hooks/                           # Custom React hooks
│   │   └── useGenerateModel.ts          # Reconstruction pipeline
│   │
│   ├── services/                        # API & utilities
│   │   ├── reconstruction/
│   │   │   ├── ReconstructionService.ts     # Service interface
│   │   │   ├── HttpReconstructionService.ts # HTTP implementation
│   │   │   ├── api.ts                      # API client
│   │   │   ├── stages.ts                   # Pipeline stages
│   │   │   ├── types.ts                    # Type definitions
│   │   │   └── index.ts                    # Factory & exports
│   │   └── downloads/
│   │       └── index.ts                    # File utilities
│   │
│   └── store/                           # State management
│       ├── useBackendStore.ts           # Backend config state
│       └── useCreateStore.ts            # Images & results
│
├── index.html                           # HTML template
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── vite.config.ts                       # Vite config
├── tailwind.config.js                   # Tailwind config
├── postcss.config.js                    # PostCSS config
├── .eslintrc.cjs                        # ESLint config
├── .gitignore                           # Git ignore
├── README.md                            # Full documentation
└── QUICKSTART.md                        # Quick start guide
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
```

## Screens & Navigation

### Home Screen
- **Backend Connection**: Configure and test backend URL
- **Visualize 3D**: Load and inspect 3D models
- **Create 3D**: Start the model generation workflow

### Create Screen
- Instructions for capturing photos
- Tips for best results
- Progress indicator
- Navigation to camera capture

### Camera Capture Screen
- Real-time webcam preview
- Guided capture steps (Front, Left, Right, Back, etc.)
- File upload option
- Image validation
- Image management (remove, reorder)

### Processing Screen
- Overall progress bar
- Pipeline stage visualization
- Real-time status updates
- Error handling with retry option

### Result Screen
- Model metadata display
- Processing statistics
- Download GLB button
- Create another model option

### Visualize Screen
- File upload area
- Supported format information
- Model preview (extensible with Three.js)

## Configuration

### Backend URL

**Default**: `http://localhost:8000`

**Change at runtime**:
1. Click "Backend Connection" on home screen
2. Enter new URL
3. Click "Test & Save"

**Environment variable** (future enhancement):
```bash
VITE_BACKEND_URL=http://your-backend:8000 npm run dev
```

### Image Limits

In `src/config.ts`:
```typescript
export const MIN_IMAGES = 3;      // Minimum images required
export const MAX_IMAGES = 24;     // Maximum images allowed
export const POLL_INTERVAL_MS = 1500;  // Job status poll interval
```

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
```

### Deploy to AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload dist/ to S3
aws s3 sync dist/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

Build and run:
```bash
docker build -t 3d-scanner-web .
docker run -p 5173:5173 3d-scanner-web
```

## Troubleshooting

### Dependencies Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

```bash
# Use different port
npm run dev -- --port 3000
```

### Backend Connection Failed

1. Verify backend is running: `python -m backend.main`
2. Check backend URL in configuration
3. Test with curl:
   ```bash
   curl http://localhost:8000/health
   ```
4. Check firewall settings

### Camera Permission Denied

1. Grant camera permission in browser
2. Check browser privacy settings
3. Try incognito/private mode
4. Try different browser

### Build Fails

```bash
# Clear build cache
rm -rf dist/

# Rebuild
npm run build

# Check for TypeScript errors
npm run type-check
```

## Performance Optimization

### Production Build

The production build includes:
- Code minification
- Tree shaking
- CSS optimization
- Image optimization

### Caching

Browser caching is configured via:
- Cache busting with content hashes
- Service worker support (can be added)

### Bundle Size

Current estimated bundle size: ~200KB (gzipped)

Optimize further with:
- Code splitting by route
- Lazy loading components
- Image optimization

## Security Considerations

1. **CORS**: Backend should allow requests from web app domain
2. **HTTPS**: Use HTTPS in production
3. **API Keys**: Don't hardcode sensitive data
4. **Input Validation**: All inputs are validated
5. **File Upload**: Files are validated before processing

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

**Required features**:
- ES2020 JavaScript support
- HTML5 Canvas API
- MediaDevices API (for camera)
- File API (for uploads)
- localStorage (for persistence)

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature
```

### 2. Make Changes
```bash
npm run dev  # Test changes
npm run lint # Check code quality
npm run type-check # Verify types
```

### 3. Build & Test
```bash
npm run build
npm run preview
```

### 4. Commit & Push
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

## Next Steps

1. **Install dependencies**: `npm install`
2. **Start backend**: `python -m backend.main`
3. **Start web app**: `npm run dev`
4. **Configure backend URL** in the app
5. **Start creating 3D models**!

## Support & Documentation

- **README.md**: Full feature documentation
- **QUICKSTART.md**: Quick start guide
- **WEB_APP_SUMMARY.md**: Architecture overview
- **Backend README**: Backend setup guide
- **Engine README**: Reconstruction engine details

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vite Documentation](https://vitejs.dev)

---

**Ready to get started?** Run `npm install` and `npm run dev` now!
