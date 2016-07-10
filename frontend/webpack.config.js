var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: [

    ],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.scss|\.css$/,
                loader: ExtractTextPlugin.extract('css?modules&localIdentName=[name]_[local]_[hash:base64:5]!sass?outputStyle=expanded')
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('style.css', {
            allChunks: true
        })
    ]
};