const webpack = require('webpack');
const path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
      'app': path.resolve(__dirname, 'src/app/main.js'),
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
        {from: 'static'}
      ]),
      new MiniCssExtractPlugin({
        filename: '[name].[chunkhash].css'
      }),
      new webpack.ProvidePlugin({
        '$': 'jquery',
        'jQuery': 'jquery',
        'window.jQuery': 'jquery'
      }),
      new ServiceWorkerWebpackPlugin({
        entry: path.resolve(__dirname, 'src/sw/main.js')
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
