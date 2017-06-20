const path = require('path');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');

module.exports = {

  entry: {
    // 'vendor': './src/js/vendor.js',
    'index': './src/js/page.js'
  },

  resolve: {

    extensions: ['.js', '.css','*'],
    alias: {
    	js: path.resolve(__dirname,'../src/js'),
    	css: path.resolve(__dirname,'../src/css'),
    }

  },

  module: {

    rules: [

      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },

      {
      	test: /\.css/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader'
          }
        ]
        })
      },

      {
        test: /\.(jpg|png|gif|obj|mtl|dae|wav|ogg|eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]'
        }
      },

      {
        test: /\.(mp4|webm)$/,
        loader: 'url?limit=10000'
      }

    ]

  },

  plugins: [
    // new CommonsChunkPlugin({
    //   name: ['index', 'vendor'],
    //   minChunks: Infinity
    // }),
    new ExtractTextPlugin('[name].css'),
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(__dirname, '../src/index.html')
      // favicon: path.resolve(__dirname, '../src/favicon.ico')
    })
  ]

};
