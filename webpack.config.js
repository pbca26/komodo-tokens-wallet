const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './bootstrap.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bootstrap.js',
  },
  mode: 'development',
  module: {
    rules: [{
      test: /\.(jsx|js)$/,
      include: path.resolve(__dirname, 'src'),
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              'targets': 'defaults' 
            }],
            '@babel/preset-react'
          ]
        }
      }]
    },
    {
      test:/\.(s*)css$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        'sass-loader',
      ]
   },
    {
      test: /\.(png|svg|jpg|gif)$/,
      use: [{
        loader: 'url-loader',
        options: {
          name: '[name].[hash:8].[ext]',
          outputPath: 'assets/',
          limit: 10000
        }
      }]
    },
    {
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 50000,
        outputPath: 'assets/',
        name: '[name].[hash:8].[ext]'
      }
    }]
  },
  plugins: [
    new CopyWebpackPlugin(['index.html']),
    new MiniCssExtractPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
  devServer: {
    historyApiFallback: true,
    hot: true,
    host: '0.0.0.0',
    inline: true,
    disableHostCheck: true,
    contentBase: './build',
  }
};