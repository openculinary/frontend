const path = require('path');
const glob = require('glob');

const { InjectManifest } = require('workbox-webpack-plugin');
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


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
      new LicenseWebpackPlugin({
        additionalModules: [
          {
            name: 'RecipeML',
            directory: path.join(__dirname, 'src', 'RecipeML')
          },
        ],
        handleMissingLicenseText: (package) => { throw Error(`Could not determine license for ${package}`) },
        licenseTypeOverrides: {
          'dexie-observable': 'SEE LICENSE IN https://github.com/dexie/Dexie.js/blob/16eb2b5a369960fa5a9197b238ceccb12f49b22c/addons/Dexie.Observable/package.json#L33',
          'jsondiffpatch': 'SEE LICENSE IN https://github.com/benjamine/jsondiffpatch/blob/a8cde4c666a8a25d09d8f216c7f19397f2e1b569/package.json#L81',
          'slipjs': 'SEE LICENSE IN https://github.com/kornelski/slip/blob/91c24e460dbadb9e0dc40daf93fd01928bfac94d/package.json#L18'
        },
        outputFilename: 'licenses.txt',
        perChunkOutput: false
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
      concatenateModules: false,  // module concatenation, enabled by default for production builds, can potentially confuse license-webpack-plugin
      realContentHash: true,
      sideEffects: true,
      usedExports: true
    }
}};
