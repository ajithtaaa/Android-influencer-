// Adds a release signing config to android/app/build.gradle during
// `expo prebuild`. Keystore details come from environment variables so no
// secret ever lives in the repo. Without them, release builds fall back to
// the debug key (fine for testing, not for Play uploads).
const { withAppBuildGradle } = require('expo/config-plugins');

const SIGNING = `
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) {
                storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes('ANDROID_KEYSTORE_PATH')) return cfg;
    gradle = gradle.replace(/signingConfigs\s*\{/, (m) => `${m}${SIGNING}`);
    gradle = gradle.replace(
      /(release\s*\{[^}]*?)signingConfig\s+signingConfigs\.debug/,
      '$1signingConfig System.getenv("ANDROID_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug',
    );
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
