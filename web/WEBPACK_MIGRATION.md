# Webpack Migration Guide

The React web app has been successfully migrated from Vite to Webpack.

## Changes Made

### 1. **package.json**
- Removed Vite dependencies (`vite`, `@vitejs/plugin-react`)
- Added Webpack dependencies:
  - `webpack` - Core bundler
  - `webpack-cli` - CLI tool
  - `webpack-dev-server` - Development server
  - `html-webpack-plugin` - HTML generation
  - `ts-loader` - TypeScript loader
  - `style-loader`, `css-loader`, `postcss-loader` - CSS loaders
  - `babel-loader` - JavaScript transpilation
  - Babel presets for React and TypeScript

### 2. **webpack.config.js** (NEW)
- Entry point: `src/main.tsx`
- Output: `dist/bundle.[contenthash].js`
- Loaders configured for:
  - TypeScript/TSX files
  - CSS with PostCSS support
  - Images and assets
- Dev server on port 3000 with hot reload
- Source maps for debugging

### 3. **.babelrc** (NEW)
- Babel configuration for React and TypeScript
- Automatic JSX runtime

### 4. **Configuration Updates**
- `postcss.config.js` - Changed to CommonJS
- `tailwind.config.js` - Changed to CommonJS
- `tsconfig.json` - Updated for Webpack (moduleResolution: node)

### 5. **Scripts**
```json
{
  "dev": "webpack serve --mode development",
  "build": "webpack --mode production",
  "lint": "eslint . --ext ts,tsx",
  "type-check": "tsc --noEmit"
}
```

## Setup & Running

### 1. Clean Install
```bash
# Remove old node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:3000` with hot module reloading.

### 3. Build for Production
```bash
npm run build
```

Output will be in the `dist/` folder.

## Key Differences from Vite

| Feature | Vite | Webpack |
|---------|------|---------|
| Dev Server Port | 5173 | 3000 |
| Build Tool | Rollup-based | Webpack |
| Config File | vite.config.ts | webpack.config.js |
| Hot Reload | Native ESM | HMR via dev-server |
| Build Speed | Faster | Slightly slower |
| Configuration | Simpler | More verbose |

## Troubleshooting

### Port 3000 Already in Use
```bash
# Use a different port
webpack serve --port 3001
```

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
```

### CSS Not Loading
- Ensure `postcss-loader` is installed
- Check `tailwind.config.js` is using CommonJS export
- Verify CSS file is imported in `src/main.tsx`

## File Structure

```
web/
├── webpack.config.js          # Webpack configuration
├── .babelrc                   # Babel configuration
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Main component
│   ├── index.css             # Global styles
│   └── ...                   # Other source files
├── index.html                # HTML template
└── dist/                     # Build output (generated)
```

## Next Steps

1. Run `npm install` to install all dependencies
2. Run `npm run dev` to start the development server
3. Open `http://localhost:3000` in your browser
4. Start developing!

## Notes

- All source files remain unchanged
- The app functionality is identical to the Vite version
- Webpack provides more control and customization options
- Build output is optimized with content hashing for caching
