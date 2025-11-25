module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      [
        'module-resolver',
        {
          alias: {
            '@': './',
            '@/app': './app',
            '@/components': './components',
            '@/constants': './constants',
            '@/contexts': './contexts',
            '@/hooks': './hooks',
            '@/lib': './lib',
            '@/types': './types',
            '@/utils': './utils',
            '@/backend': './backend'
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
