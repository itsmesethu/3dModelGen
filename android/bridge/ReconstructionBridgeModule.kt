package com.modelgen3d.bridge

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.util.concurrent.Executors

/**
 * Native Android Bridge — pure communication layer.
 *
 * Responsibilities (and nothing more):
 *  - receive image paths from React Native
 *  - call the Reconstruction Engine
 *  - forward progress callbacks as events
 *  - return the generated GLB path + metadata (or an error)
 *
 * It contains NO reconstruction logic. The engine is invoked through
 * [EngineRunner], so swapping Python (Chaquopy) for a future C++/ONNX
 * implementation only requires a new EngineRunner — React Native never
 * changes.
 */
class ReconstructionBridgeModule(
    reactContext: ReactApplicationContext,
    private val engineRunner: EngineRunner = ChaquopyEngineRunner(),
) : ReactContextBaseJavaModule(reactContext) {

    private val executor = Executors.newSingleThreadExecutor()

    override fun getName() = NAME

    /** Whether an on-device engine is bundled in this build. */
    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(engineRunner.isAvailable(reactApplicationContext))
    }

    /** Engine environment report (mirrors engine_info()). */
    @ReactMethod
    fun getEngineInfo(promise: Promise) {
        executor.execute {
            try {
                promise.resolve(engineRunner.engineInfo(reactApplicationContext))
            } catch (error: Exception) {
                promise.reject("ENGINE_INFO_FAILED", error.message, error)
            }
        }
    }

    /** Single-image quality check used by guided capture. */
    @ReactMethod
    fun validateImage(imagePath: String, promise: Promise) {
        executor.execute {
            try {
                promise.resolve(
                    engineRunner.validateImage(reactApplicationContext, imagePath)
                )
            } catch (error: Exception) {
                promise.reject("VALIDATION_FAILED", error.message, error)
            }
        }
    }

    /**
     * Run the full pipeline. Progress is emitted as
     * `ReconstructionProgress { percent, stage }` events; the promise
     * resolves with `{ modelPath, previewPath?, metadata }`.
     */
    @ReactMethod
    fun generateModel(imagePaths: ReadableArray, promise: Promise) {
        val paths = (0 until imagePaths.size()).mapNotNull { imagePaths.getString(it) }
        executor.execute {
            try {
                val outputDir = File(reactApplicationContext.cacheDir, "generated")
                    .apply { mkdirs() }
                val result = engineRunner.generateModel(
                    context = reactApplicationContext,
                    imagePaths = paths,
                    outputDirectory = outputDir.absolutePath,
                ) { percent, stage ->
                    val payload = Arguments.createMap().apply {
                        putDouble("percent", percent)
                        putString("stage", stage)
                    }
                    reactApplicationContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit(PROGRESS_EVENT, payload)
                }
                promise.resolve(result)
            } catch (error: Exception) {
                promise.reject("RECONSTRUCTION_FAILED", error.message, error)
            }
        }
    }

    // Required for NativeEventEmitter on iOS parity; no-ops on Android.
    @ReactMethod
    fun addListener(eventName: String) = Unit

    @ReactMethod
    fun removeListeners(count: Int) = Unit

    companion object {
        const val NAME = "ReconstructionBridge"
        const val PROGRESS_EVENT = "ReconstructionProgress"
    }
}
