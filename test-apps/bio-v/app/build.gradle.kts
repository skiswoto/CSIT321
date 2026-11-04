// Bio-V: the deliberately vulnerable controlled test app (PRD 12.1, Tier 1).
// Android Gradle plugin 9 compiles Kotlin itself, so no Kotlin plugin is applied.
plugins {
    id("com.android.application")
}

android {
    namespace = "com.fyp2608.biov"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.fyp2608.biov"
        minSdk = 28 // BiometricPrompt exists in the framework from API 28
        targetSdk = 35
        versionCode = 1
        versionName = "0.1-spike"
    }

    buildTypes {
        // A second, minified build, to see what the static spike still finds
        // once R8 has renamed and removed code.
        create("minified") {
            initWith(getByName("debug"))
            // R8 only renames classes in non-debuggable builds. This makes the
            // build release-like (PRD A8), which is fine for static analysis.
            isDebuggable = false
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
            matchingFallbacks += "debug"
        }
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.8.0")
    implementation("androidx.biometric:biometric:1.1.0")
}
