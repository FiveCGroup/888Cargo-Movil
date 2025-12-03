// babel.config.js ← VERSIÓN FINAL 100% CORRECTA PARA EXPO SDK 54 + REANIMATED 4
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ← SOLO ESTA LÍNEA. ELIMINA LA OTRA
      'react-native-worklets/plugin',
    ],
  };
};