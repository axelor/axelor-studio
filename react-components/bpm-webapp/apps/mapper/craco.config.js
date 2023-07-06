const path = require('path');
const { getLoader, loaderByName } = require('@craco/craco');

const appsDir = path.resolve('../');

const apps = ['generic-builder'];
const sources = apps.map(name => path.join(appsDir, name, 'src'));

module.exports = {
  webpack: {
    configure: (webpackConfig, arg) => {
      const { isFound, match } = getLoader(
        webpackConfig,
        loaderByName('babel-loader')
      );
      if (isFound) {
        const include = Array.isArray(match.loader.include)
          ? match.loader.include
          : [match.loader.include];

        match.loader.include = include.concat(sources);
      }
      return webpackConfig;
    },
  },
};
