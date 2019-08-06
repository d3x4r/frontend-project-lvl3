const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        // loader: ['babel-loader', 'eslint-loader'],
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'eslint-loader',
            options: {
              quiet: true,
              failOnWarning: false,
              failOnError: false,
            },
          },
        ],
      }, {
        test: /\.(scss)$/,
        use: [{
          loader: MiniCssExtractPlugin.loader, // inject CSS to page
        }, {
          loader: 'css-loader', // translates CSS into CommonJS modules
        }, {
          loader: 'postcss-loader', // Run postcss actions
          options: {
            plugins() { // postcss plugins, can be exported to postcss.config.js
              return [
                autoprefixer,
              ];
            },
          },
        }, {
          loader: 'sass-loader', // compiles Sass to CSS
        }],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Rss-reader',
      template: path.resolve(__dirname, 'template.html'),
    }), new MiniCssExtractPlugin({
      filename: 'style.css',
      chunkFilename: '[id].css',
      ignoreOrder: false,
    }),
  ],
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
