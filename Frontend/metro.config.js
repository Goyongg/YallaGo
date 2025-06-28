const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Добавляем поддержку .cjs файлов
config.resolver.sourceExts.push("cjs");

// Отключаем package exports для совместимости с Firebase
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./app/globals.css" });
