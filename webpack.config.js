const path = require('path');  // this is a built-in Node module that provides utilities for working with file and directory paths
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
module.exports = {
    entry: './src/background.js',  // the starting point for our program
    output: {
        filename: 'compiled.js',  // the name of the file that will contain our output - we could name this whatever we want
        // by default, the output file will be created in the dist folder of your project
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new BundleAnalyzerPlugin()
    ]
};