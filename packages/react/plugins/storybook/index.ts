import { Configuration } from 'webpack';
const reactWebpackConfig = require('../webpack');
import { logger } from '@storybook/node-logger';
import { mergePlugins } from './merge-plugins';
import * as mergeWebpack from 'webpack-merge';
import { join } from 'path';
import { getStylesPartial, getWebConfig } from '@nrwl/web/src/utils/web.config';
import { getBaseWebpackPartial } from '@nrwl/web/src/utils/config';
import { readJsonFile } from '@nrwl/workspace/src/utilities/fileutils';
import { appRootPath } from '@nrwl/workspace/src/utilities/app-root';

const CWD = process.cwd();

export const babelDefault = (): Record<
  string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  (string | [string, object])[]
> => {
  // Add babel plugin for styled-components or emotion.
  // We don't have a good way to know when a project uses one or the other, so
  // add the plugin only if the other style package isn't used.
  const packageJson = readJsonFile(join(appRootPath, 'package.json'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const hasStyledComponents = !!deps['styled-components'];

  const plugins = [];
  if (hasStyledComponents) {
    plugins.push(['styled-components', { ssr: false }]);
  }

  return {
    presets: [],
    plugins: [...plugins],
  };
};

export const webpack = (
  webpackConfig: Configuration = {},
  options: any //StorybookConfig
): Configuration => {
  logger.info(
    '=> Loading Nrwl React Webpack configuration "@nrwl/react/plugins/webpack"'
  );

  const tsconfigPath = join(CWD, options.configDir, 'tsconfig.json');

  const builderOptions: any = {
    ...options,
    root: options.configDir,
    sourceRoot: '',
    fileReplacements: [],
    sourceMap: {
      hidden: false,
      scripts: true,
      styles: true,
      vendors: false,
    },
    styles: [],
    // scripts: [],
    // outputPath: 'dist',
    // index: 'index.html',
    optimization: {},
    tsConfig: tsconfigPath,
    extractCss: webpackConfig.mode === 'production',
  };

  const esm = true;
  const isScriptOptimizeOn = webpackConfig.mode !== 'development';
  const extractCss = webpackConfig.mode === 'production';

  // const baseWebpackConfig = getWebConfig(
  //   options.configDir,
  //   '',
  //   builderOptions,
  //   esm,
  //   isScriptOptimizeOn
  // );

  // ESM build for modern browsers.
  const baseWebpackConfig = mergeWebpack([
    getBaseWebpackPartial(builderOptions, esm, isScriptOptimizeOn),
    // getPolyfillsPartial(
    //   options.polyfills,
    //   options.es2015Polyfills,
    //   esm,
    //   isScriptOptimizeOn
    // ),
    getStylesPartial(options.configDir, builderOptions, extractCss),
    // getCommonPartial(wco),
    // getBrowserPartial(wco, options, isScriptOptimizeOn),
  ]);
  const finalConfig = reactWebpackConfig(baseWebpackConfig);

  return {
    ...webpackConfig,
    plugins: mergePlugins(...webpackConfig.plugins, ...finalConfig.plugins),
  };
};
