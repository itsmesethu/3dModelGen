# Native Android Bridge (Production Mode)

Pure communication layer between React Native and the Reconstruction
Engine for the standalone APK. **No reconstruction logic lives here.**

```
React Native
    ↓  NativeModules.ReconstructionBridge
ReconstructionBridgeModule (Kotlin)
    ↓  EngineRunner interface
ChaquopyEngineRunner (Python engine, initial)   ← swappable
    ↓
engine.generate_model(...)  →  GLB
```

## Contract (mirrors shared/contracts/reconstruction.md)

| Method | Description |
| ------ | ----------- |
| `isAvailable()` | Whether an on-device engine is bundled in this build |
| `getEngineInfo()` | Engine environment report |
| `validateImage(path)` | Guided-capture quality check |
| `generateModel(paths[])` | Full pipeline → `{ modelPath, previewPath?, metadata }` |
| event `ReconstructionProgress` | `{ percent: 0..100, stage: string }` |

The React Native side already selects this bridge automatically when
present — see `mobile/src/services/reconstruction/index.ts`. In its
absence the app falls back to the HTTP development wrapper. **No JS
changes are needed to switch modes.**

## Enabling the on-device Python engine (Chaquopy)

1. Copy `bridge/*.kt` into
   `mobile/android/app/src/main/java/com/modelgen3d/bridge/`.
2. Register `ReconstructionBridgePackage()` in `MainApplication.kt`
   (`getPackages()`).
3. Apply Chaquopy in `mobile/android/app/build.gradle`:
   ```groovy
   plugins { id 'com.chaquo.python' version '16.0.0' }
   android {
       defaultConfig {
           python {
               pip {
                   install "numpy"
                   install "opencv-python-headless"
                   install "trimesh"
                   install "scikit-image"
                   install "Pillow"
               }
           }
       }
       sourceSets.main.python.srcDirs += "../../../engine"
   }
   ```
4. Uncomment the Chaquopy blocks in `EngineRunner.kt`.

## Replacing Python later

Implement a new `EngineRunner` (e.g. `CppEngineRunner` over JNI, or an
`OnnxEngineRunner`) honoring the same contract, and pass it to
`ReconstructionBridgeModule`. Nothing in React Native — screens,
navigation, viewer, download flow — changes.
