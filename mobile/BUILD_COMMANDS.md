# Android Build Commands

## Gradle Optimizations Applied

The following optimizations have been configured in `android/gradle.properties`:

- **Increased Memory**: 4GB heap, 1GB metaspace
- **Parallel Builds**: Enabled for faster multi-module compilation
- **Build Cache**: Enabled to reuse outputs from previous builds
- **Configure on Demand**: Only configure projects that are needed
- **Gradle Daemon**: Keeps Gradle running in background for faster subsequent builds
- **Architecture**: Limited to `arm64-v8a` only (most modern devices)
- **Windows Long Paths**: Enabled to fix C++ build path length issues (260 char limit)

## Clean Commands

### Full Clean (Most thorough)
```powershell
# Stop all Gradle daemons
cd d:\Projects\3dModelGen\mobile\android
.\gradlew --stop

# Clean everything
Remove-Item -Path ".\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\.gradle" -Recurse -Force -ErrorAction SilentlyContinue

# Clean node modules build artifacts
cd ..
Remove-Item -Path ".\node_modules\react-native-worklets\android\.cxx" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\node_modules\react-native-reanimated\android\.cxx" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\node_modules\react-native-vision-camera\android\.cxx" -Recurse -Force -ErrorAction SilentlyContinue
```

### Quick Clean (Gradle only)
```powershell
cd d:\Projects\3dModelGen\mobile\android
.\gradlew clean
```

### Clean Gradle Cache (if builds are acting weird)
```powershell
cd d:\Projects\3dModelGen\mobile\android
.\gradlew cleanBuildCache
```

## Build Commands

### Debug Build (Development)
```powershell
# From mobile directory
cd d:\Projects\3dModelGen\mobile

# Build and install on connected device
npm run android

# OR build APK only (without installing)
cd android
.\gradlew assembleDebug
# Output: android\app\build\outputs\apk\debug\app-debug.apk
```

### Release Build (Production)
```powershell
# From mobile directory
cd d:\Projects\3dModelGen\mobile\android

# Build release APK
.\gradlew assembleRelease

# Output location:
# android\app\build\outputs\apk\release\app-release.apk
```

### Build and Install Release on Device
```powershell
cd d:\Projects\3dModelGen\mobile\android
.\gradlew installRelease
```

## Install APK via ADB

### Install Debug APK
```powershell
adb install d:\Projects\3dModelGen\mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

### Install Release APK
```powershell
adb install d:\Projects\3dModelGen\mobile\android\app\build\outputs\apk\release\app-release.apk
```

### Install with Overwrite (if app already exists)
```powershell
adb install -r d:\Projects\3dModelGen\mobile\android\app\build\outputs\apk\release\app-release.apk
```

### Uninstall App
```powershell
adb uninstall com.modelgen3d
```

## Troubleshooting Commands

### Check Connected Devices
```powershell
adb devices
```

### Check if App is Installed
```powershell
adb shell pm list packages | findstr com.modelgen3d
```

### View Gradle Build Info
```powershell
cd d:\Projects\3dModelGen\mobile\android
.\gradlew --version
.\gradlew tasks
```

### Build with Stack Trace (for debugging build errors)
```powershell
cd d:\Projects\3dModelGen\mobile\android
.\gradlew assembleRelease --stacktrace
```

### Build with More Logging
```powershell
cd d:\Projects\3dModelGen\mobile\android
.\gradlew assembleRelease --info
```

## Recommended Build Workflow

### First Time / After Major Changes
```powershell
# 1. Stop Gradle daemons
cd d:\Projects\3dModelGen\mobile\android
.\gradlew --stop

# 2. Full clean
cd ..
Remove-Item -Path ".\android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Build release
cd android
.\gradlew assembleRelease
```

### Quick Rebuild (After Code Changes)
```powershell
cd d:\Projects\3dModelGen\mobile\android
.\gradlew assembleRelease
```

## Build Time Expectations

With optimizations:
- **First build**: 10-15 minutes (compiling C++ modules)
- **Incremental builds**: 2-5 minutes (only changed files)
- **Clean builds**: 8-12 minutes

## Keystore Information

**Location**: `d:\Projects\3dModelGen\mobile\android\app\modelgen3d-release.keystore`

**Credentials**:
- Store Password: `modelgen3d123`
- Key Alias: `modelgen3d`
- Key Password: `modelgen3d123`

⚠️ **Important**: Keep this keystore file safe! You'll need it to update the app in the future.

## Notes

- The app is configured to build only for `arm64-v8a` architecture (64-bit ARM)
- This covers most modern Android devices (2017+)
- If you need to support older devices, edit `android/gradle.properties` and add more architectures
- Build cache is enabled - subsequent builds will be much faster
