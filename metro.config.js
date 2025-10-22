// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 🧩 Nur erweitern, nicht überschreiben:
if (!config.resolver.extraNodeModules) {
  config.resolver.extraNodeModules = {};
}

config.resolver.extraNodeModules['@rork/toolkit-sdk'] = path.resolve(
  __dirname,
  'mocks/rork-toolkit-sdk.js'
);

module.exports = config;
