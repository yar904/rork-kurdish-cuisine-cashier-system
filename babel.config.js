module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        [
          'module-resolver',
          {
            root: ['./'],
            alias: {
              '@': './',
              '@components': './components',
              '@constants': './constants',
              '@contexts': './contexts',
              '@lib': './lib',
              '@backend': './backend',
              '@types': './types',
              '@assets': './assets'
            },
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.native.js', '.web.js']
          }
        ],
        'react-native-reanimated/plugin'
      ]
    };
  };