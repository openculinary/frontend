const webpack = require('webpack');
const path = require('path');
const glob = require('glob');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const LicensePlugin = require('webpack-license-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = (_, env) => {
  const html2canvas = env && env.mode === 'production' ? 'html2canvas.min.js' : 'html2canvas.js';
  return {
    entry: {
      'app': path.resolve(__dirname, 'src/app/main.js'),
      'feedback': path.resolve(__dirname, 'src/feedback/loader.js'),
      'html2canvas': path.resolve(__dirname, `node_modules/html2canvas/dist/${html2canvas}`),
      'locales': glob.sync('./i18n/locales/*/*.po', {ignore: ['./i18n/locales/templates/*.po']}),
      'sw': path.resolve(__dirname, 'src/sw/loader.js')
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
      new CleanWebpackPlugin(),
      new LicensePlugin(),
      new CopyWebpackPlugin([
        {
          from: 'LICENSE'
        }
      ]),
      new CopyWebpackPlugin([
        {
          from: 'src/feedback/LICENSE',
          to: 'LICENSE.feedback'
        }
      ]),
      new CopyWebpackPlugin([
        {
          from: 'static',
          ignore: ['images/icons/**']
        }
      ]),
      new CopyWebpackPlugin([
        {
          from: `static/images/icons/${env && env.mode || 'development'}/*`,
          to: 'images/icons',
          flatten: true
        }
      ]),
      new MiniCssExtractPlugin({
        filename: '[name].[chunkhash].css'
      }),
      new OptimizeCSSAssetsPlugin(),
      new webpack.ProvidePlugin({
        '$': 'jquery',
        'jQuery': 'jquery',
        'window.jQuery': 'jquery'
      }),
      new InjectManifest({
        dontCacheBustURLsMatching: /.*/,
        exclude: ['vendors'],
        swSrc: path.resolve(__dirname, 'src/sw/sw.js')
      }),
      new HtmlWebpackPlugin({
        excludeChunks: ['locales'],
        template: path.resolve(__dirname, 'src/index.html'),
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
            {loader: 'i18next-gettext-loader'}
          ]
        },
        {
          test: /\.(ttf|otf|eot|svg|woff|woff2)$/,
          loader: 'file-loader',
          options: {
            outputPath: 'fonts'
          }
        },
      ]
    }
}};
