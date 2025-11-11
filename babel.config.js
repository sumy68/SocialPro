module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // für expo-router (muss zuerst kommen)
      'expo-router/babel',

      // für saubere Alias-Auflösung
      [
        'module-resolver',
        {
          root: ['.'], // Projektroot
          alias: {
            '@': '.',        // @ -> Projektroot (z. B. constants/, hooks/, utils/)
            '@app': './app', // optional, falls du app-spezifische Imports willst
          },
          extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        },
      ],
    ],
  };
};
