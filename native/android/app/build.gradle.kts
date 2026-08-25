plugins {
    id("com.android.application")
}

android {
    namespace = "com.nkcars.buyingbrowser"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.nkcars.buyingbrowser"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-poc"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
