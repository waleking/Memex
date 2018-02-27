require('babel-polyfill')
const context = require.context('../src', true, /.*\.browser-test\.js$/)
context.keys().forEach(context)
