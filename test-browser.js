'use strict';

const fs = require('fs');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('');
Reflect.defineProperty(dom.window, 'exitCode', {
  set (code) {
    process.exitCode = code;
  },
  get () {
    return process.exitCode;
  }
});
dom.window.eval(`
function require(requested) {
  if (requested !== './index') {
    throw new Error('wrong file required');
  }

  const module = {};
  (module => {
${fs.readFileSync('./index.js').toString('utf8')}
  })(module);
  return module.exports;
}

(() => {
  ${fs.readFileSync('./test.js').toString('utf8')}
})();
`);
