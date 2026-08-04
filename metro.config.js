const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add 'cjs' to sourceExts for Firebase JS SDK v10+ compatibility
defaultConfig.resolver.sourceExts.push('cjs');

// Disable unstable_enablePackageExports to avoid module resolution issues
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
