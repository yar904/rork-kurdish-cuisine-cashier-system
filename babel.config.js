module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './',
            '@/app': './app',
            '@/components': './components',
            '@/constants': './constants',
            '@/backend': './backend'
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
