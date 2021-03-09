const path = require('path');
const glob = require('glob');

const { InjectManifest } = require('workbox-webpack-plugin');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = (_, env) => {
  const html2canvas = env && env.mode === 'production' ? 'html2canvas.min.js' : 'html2canvas.js';
  return {
    entry: {
      'app': path.resolve(__dirname, 'src/app/main.ts'),
      'diagnostics': path.resolve(__dirname, 'src/diagnostics/main.js'),
      'feedback': path.resolve(__dirname, 'src/feedback/loader.js'),
      'html2canvas': path.resolve(__dirname, `node_modules/html2canvas/dist/${html2canvas}`),
      'locales': glob.sync('./i18n/locales/*/*.po', {ignore: ['./i18n/locales/templates/*.po']}),
      'sw': path.resolve(__dirname, 'src/sw/loader.js')
    },
    resolve: {
      extensions: ['.js', '.ts']
    },
    output: {
      path: path.resolve(__dirname, 'public'),
      filename: (entry) => {
        if (entry.chunk.name === 'html2canvas') return 'html2canvas.js';
        return '[name].[chunkhash].js';
      },
      libraryTarget: 'var',
      library: '[name]'
    },
    plugins: [
      new LicenseWebpackPlugin({
        perChunkOutput: false
      }),
      new CopyWebpackPlugin({patterns: [
        {
          from: 'static/.well-known',
          to: '.well-known',
          noErrorOnMissing: true
        }
      ]}),
      new CopyWebpackPlugin({patterns: [
        {
          from: 'LICENSE'
        }
      ]}),
      new CopyWebpackPlugin({patterns: [
        {
          from: 'src/feedback/LICENSE',
          to: 'LICENSE.feedback'
        }
      ]}),
      new CopyWebpackPlugin({patterns: [
        {
          from: 'static',
          globOptions: {
            ignore: ['images/icons/**']
          }
        }
      ]}),
      new CopyWebpackPlugin({patterns: [
        {
          from: `static/images/icons/${env && env.mode || 'development'}/*`,
          to: 'images/icons/[name][ext]'
        }
      ]}),
      new MiniCssExtractPlugin({
        filename: '[name].[chunkhash].css'
      }),
      new OptimizeCSSAssetsPlugin(),
      new InjectManifest({
        dontCacheBustURLsMatching: /.*/,
        exclude: ['vendors'],
        swSrc: path.resolve(__dirname, 'src/sw/sw.js')
      }),
      new HtmlWebpackPlugin({
        excludeChunks: ['diagnostics', 'locales'],
        template: path.resolve(__dirname, 'src/index.html'),
        minify: {
          collapseWhitespace: false,
          removeComments: false,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        },
        inject: false
      }),
      new HtmlWebpackPlugin({
        chunks: ['diagnostics'],
        filename: 'diagnostics/index.html',
        template: path.resolve(__dirname, 'src/diagnostics/index.html'),
        inject: false
      })
    ],
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader']
        },
        {
          test: /\.po$/,
          use: [
            {
              loader: 'file-loader', options: {
                regExp: 'i18n\/locales\/(.*)\/(.*).po$',
                name: 'locales/[1]/[2].json'
              }
            },
            {loader: '@openculinary/i18next-gettext-loader'}
          ]
        },
        {
          test: /\.(ttf|otf|eot|svg|woff|woff2)$/,
          loader: 'file-loader',
          options: {
            outputPath: 'fonts'
          }
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader'
        },
      ]
    }
}};
