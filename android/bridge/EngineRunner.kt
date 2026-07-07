package com.modelgen3d.bridge

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

/** Progress callback matching the shared contract: percent 0..100 + stage key. */
typealias ProgressListener = (percent: Double, stage: String) -> Unit

/**
 * Abstraction over the on-device Reconstruction Engine.
 *
 * The bridge module talks only to this interface. Implementations:
 *  - [ChaquopyEngineRunner] — runs the Python engine in-process (initial)
 *  - future: CppEngineRunner (JNI), OnnxEngineRunner, TfLiteEngineRunner
 */
interface EngineRunner {
    fun isAvailable(context: Context): Boolean
    fun engineInfo(context: Context): WritableMap
    fun validateImage(context: Context, imagePath: String): WritableMap
    fun generateModel(
        context: Context,
        imagePaths: List<String>,
        outputDirectory: String,
        onProgress: ProgressListener,
    ): WritableMap
}

/**
 * Runs the bundled Python engine via Chaquopy (https://chaquo.com/chaquopy/).
 *
 * Setup (see android/README.md for the full walkthrough):
 *  1. Apply the Chaquopy Gradle plugin in mobile/android.
 *  2. Add `engine/engine` as a Python source dir + pip deps in build.gradle.
 *  3. Uncomment the Chaquopy code below (kept behind reflection-free
 *     comments so the project compiles before Chaquopy is configured).
 */
class ChaquopyEngineRunner : EngineRunner {

    override fun isAvailable(context: Context): Boolean {
        return try {
            Class.forName("com.chaquo.python.Python")
            true
        } catch (missing: ClassNotFoundException) {
            false
        }
    }

    override fun engineInfo(context: Context): WritableMap {
        ensureAvailable(context)
        /* With Chaquopy configured:
        val py = com.chaquo.python.Python.getInstance()
        val info = py.getModule("engine").callAttr("engine_info")
        return jsonToMap(info.toString())
        */
        throw IllegalStateException(NOT_CONFIGURED)
    }

    override fun validateImage(context: Context, imagePath: String): WritableMap {
        ensureAvailable(context)
        /* With Chaquopy configured:
        val py = com.chaquo.python.Python.getInstance()
        val data = java.io.File(imagePath).readBytes()
        val result = py.getModule("engine")
            .callAttr("validate_image_bytes", data)
            .callAttr("to_dict")
        return jsonToMap(pyDictToJson(result))
        */
        throw IllegalStateException(NOT_CONFIGURED)
    }

    override fun generateModel(
        context: Context,
        imagePaths: List<String>,
        outputDirectory: String,
        onProgress: ProgressListener,
    ): WritableMap {
        ensureAvailable(context)
        /* With Chaquopy configured:
        val py = com.chaquo.python.Python.getInstance()
        val callback = PyProgressProxy(onProgress) // exposes __call__(percent, stage)
        val result = py.getModule("engine").callAttr(
            "generate_model",
            imagePaths.toTypedArray(),
            outputDirectory,
            callback,
        )
        return Arguments.createMap().apply {
            putString("modelPath", result.get("model_path").toString())
            putString("previewPath", result.get("preview_path")?.toString())
            putMap("metadata", jsonToMap(pyDictToJson(result.get("metadata")!!.callAttr("to_dict"))))
        }
        */
        throw IllegalStateException(NOT_CONFIGURED)
    }

    private fun ensureAvailable(context: Context) {
        if (!isAvailable(context)) {
            throw IllegalStateException(NOT_CONFIGURED)
        }
    }

    companion object {
        private const val NOT_CONFIGURED =
            "On-device engine is not bundled in this build. " +
                "Configure Chaquopy (android/README.md) or use development mode."

        @Suppress("unused")
        internal fun emptyMap(): WritableMap = Arguments.createMap()
    }
}
