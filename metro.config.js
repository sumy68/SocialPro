const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@rork/toolkit-sdk': path.resolve(__dirname, 'mocks/rork-toolkit-sdk.js'),
};
module.exports = config;
