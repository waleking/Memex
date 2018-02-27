const path = require('path')
const webpack = require('webpack')

process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function(config) {
    config.set({
        files: [
            // all files ending in "test"
            // './node_modules/phantomjs-polyfill/bind-polyfill.js',
            'test/browser.js',
            // each file acts as entry point for the webpack configuration
            {
                pattern: 'test-content/html/**/*',
                included: false,
                served: true,
                watched: false,
                nocache: true,
            },
        ],

        // frameworks to use
        frameworks: ['mocha'],

        preprocessors: {
            // only specify one entry point
            // and require all tests in there
            'test/browser.js': ['webpack', 'sourcemap'],
        },

        reporters: ['spec', 'coverage'],

        coverageReporter: {
            dir: 'build/coverage/',
            reporters: [
                { type: 'html' },
                { type: 'text' },
                { type: 'text-summary' },
            ],
        },

        webpack: {
            // webpack configuration
            resolve: {
                extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
                modules: [path.join(__dirname, 'src', 'js'), 'node_modules'],
            },
            module: {
                rules: [
                    {
                        test: /\.jsx?$/,
                        use: 'babel-loader',
                        exclude: /node_modules/,
                    },
                ],
            },
            devtool: 'inline-source-map',
        },

        webpackMiddleware: {
            // webpack-dev-middleware configuration
            noInfo: true,
        },

        plugins: [
            require('karma-webpack'),
            require('istanbul-instrumenter-loader'),
            require('karma-mocha'),
            require('karma-coverage'),
            // require('karma-phantomjs-launcher'),
            require('karma-chrome-launcher'),
            require('karma-spec-reporter'),
            require('karma-sourcemap-loader'),
        ],

        browsers: ['ChromeHeadless'],
    })
}
