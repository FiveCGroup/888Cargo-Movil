// metro.config.js ← LA QUE TÚ NECESITAS (copia y pega tal cual)
const { getDefaultConfig } = require('expo/metro-config');

module.exports = async () => {
  const config = await getDefaultConfig(__dirname);
  return {
    ...config,
    resolver: {
      ...config.resolver,
      sourceExts: [...config.resolver.sourceExts, 'cjs', 'mjs'],
    },
  };
};