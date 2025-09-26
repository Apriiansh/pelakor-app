const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
    ...(config.resolver.alias || {}),
    tslib: require.resolve('tslib/tslib.js'),
  };

module.exports = withNativeWind(config, { input: './global.css' });
