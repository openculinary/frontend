const path = require('path');
const glob = require('glob');

const { InjectManifest } = require('workbox-webpack-plugin');
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');
const LicensePlugin = require('webpack-license-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


function manualLicenseInfo(package) {
  return {
    'jsondiffpatch': {
      'spdx': 'MIT',
      'detail': 'SEE LICENSE IN https://github.com/benjamine/jsondiffpatch/blob/a8cde4c666a8a25d09d8f216c7f19397f2e1b569/package.json#L81'
    },
    'slipjs': {
      'spdx': 'BSD-2-Clause',
      'detail': 'SEE LICENSE IN https://github.com/kornelski/slip/blob/91c24e460dbadb9e0dc40daf93fd01928bfac94d/package.json#L18'
    }
  }[package] || {'spdx': '', 'detail': package};
}


function licensesAsText(packages) {
  return packages.sort(package => package.name.toLower).map(package => `${package.name}\n${package.license}\n${package.licenseText || manualLicenseInfo(package.name)['detail']}`).join('\n\n');
}


module.exports = (_, env) => {
  const html2canvas = env && env.mode === 'production' ? 'html2canvas.min.js' : 'html2canvas.js';
  return {
    devtool: "source-map",
    entry: {
      'app': path.resolve(__dirname, 'src/app/main.ts'),
      'diagnostics': path.resolve(__dirname, 'src/diagnostics/main.js'),
      'feedback': path.resolve(__dirname, 'src/feedback/loader.js'),
      'html2canvas': path.resolve(__dirname, `node_modules/html2canvas/dist/${html2canvas}`),
      'locales': glob.sync('./i18n/locales/translations/*/*.po'),
      'sw': path.resolve(__dirname, 'src/sw/loader.js')
    },
    resolve: {
      extensions: ['.js', '.ts']
    },
    output: {
      crossOriginLoading: 'anonymous',
      path: path.resolve(__dirname, 'public'),
      filename: (entry) => {
        if (entry.chunk.name === 'html2canvas') return 'html2canvas.js';
        return '[name].[contenthash].js';
      },
      libraryTarget: 'var',
      library: '[name]'
    },
    plugins: [
      new LicensePlugin({
        additionalFiles: {'licenses.txt': licensesAsText},
        includePackages: () => [
          path.resolve(__dirname, 'src/feedback'),
          path.resolve(__dirname, 'src/RecipeML')
        ],
        licenseOverrides: {
          'jsondiffpatch': manualLicenseInfo('jsondiffpatch')['spdx'],
          'slipjs': manualLicenseInfo('slipjs')['spdx']
        },
      }),
      new CopyWebpackPlugin({patterns: [
        {
          from: 'LICENSE',
          to: 'LICENSE',
          toType: 'file'
        },
        {
          from: `static/images/icons/${env && env.mode || 'development'}/`,
          to: 'images/icons/',
          toType: 'dir'
        },
        {
          from: 'static',
          globOptions: {
            ignore: ['**/images/icons/**']
          },
          toType: 'dir'
        }
      ]}),
      new InjectManifest({
        dontCacheBustURLsMatching: /.*/,
        swSrc: path.resolve(__dirname, 'src/sw/sw.js')
      }),
      new SubresourceIntegrityPlugin({
        enabled: true,
        hashFuncNames: ['sha512'],
      }),
      new HtmlWebpackPlugin({
        excludeChunks: ['diagnostics', 'locales'],
        filename: 'index.html',
        template: path.resolve(__dirname, 'src/index.html'),
        minify: false,
        inject: false
      }),
      new HtmlWebpackPlugin({
        chunks: ['diagnostics'],
        filename: 'diagnostics/index.html',
        template: path.resolve(__dirname, 'src/diagnostics/index.html'),
        minify: false,
        inject: false
      })
    ],
    module: {
      rules: [
        {
          test: /\.po$/,
          use: [
            {
              loader: 'file-loader', options: {
                regExp: 'i18n\/locales\/translations\/(.*)\/(.*).po$',
                name: 'locales/[1]/[2].json'
              }
            },
            {loader: '@openculinary/i18next-gettext-loader'}
          ]
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader'
        },
      ]
    },
    experiments: {
      css: true,
    },
    optimization: {
      minimize: true,
      realContentHash: true,
      sideEffects: true,
      usedExports: true
    }
}};
