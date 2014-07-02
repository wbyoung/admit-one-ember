'use strict';

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [], // specified via gulp
    exclude: [],
    reporters: ['progress', 'coverage'],
    preprocessors: {
      'test/**/*.json': ['html2js'],
      'dist/**/*.js': ['coverage']
    },
    coverageReporter: {
      type : 'lcov'
    },
    port: 8080,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    captureTimeout: 60000,
    singleRun: false
  });
};
