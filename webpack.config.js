const webpack = require('webpack');
const path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
      'app': path.resolve(__dirname, 'src/app/main.js'),
      'countly': path.resolve(__dirname, 'src/countly/index.js'),
      'feedback': path.resolve(__dirname, 'src/feedback/loader.js'),
      'sw': path.resolve(__dirname, 'src/sw/loader.js')
    },
    output: {
      path: path.resolve(__dirname, 'public'),
      filename: '[name].[chunkhash].js',
      libraryTarget: 'var',
      library: ['RecipeRadar', '[name]']
    },
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin([
        {from: 'i18n/dev', to: 'i18n/en'}, // TODO: source from i18n pipeline
        {from: 'static'}
      ]),
      new MiniCssExtractPlugin({
        filename: '[name].[chunkhash].css'
      }),
      new OptimizeCSSAssetsPlugin(),
      new webpack.DefinePlugin({
        'VERSION': JSON.stringify(new GitRevisionPlugin().version())
      }),
      new webpack.ProvidePlugin({
        '$': 'jquery',
        'jQuery': 'jquery',
        'window.jQuery': 'jquery'
      }),
      new InjectManifest({
        dontCacheBustURLsMatching: /.*/,
        exclude: ['vendors'],
        importWorkboxFrom: 'local',
        swSrc: path.resolve(__dirname, 'src/sw/sw.js')
      }),
      new HtmlWebpackPlugin({
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
          test: /\.(ttf|otf|eot|svg|woff|woff2)$/,
          loader: 'file-loader',
          options: {
            outputPath: 'fonts'
          }
        },
      ]
    }
};
