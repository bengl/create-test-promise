/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
'use strict';

const isFunction = f => typeof f === 'function';
const isPromise = p => typeof p === 'object' && isFunction(p.then);

const promisify = f =>
  new Promise((resolve, reject) => f(err => err ? reject(err) : resolve()));

const timeLimit = (promise, t) =>
  Promise.race([
    promise,
    new Promise((resolve, reject) =>
      setTimeout(_ => reject(new Error(`Test timed out (${t}ms)`)), t)
    )
  ]);

function safeWrap (f, opts = {}) {
  const p = isPromise(f) ? f : new Promise((resolve, reject) => {
    process.on('uncaughtException', errFn);
    (f.length ? promisify(f) : Promise.resolve().then(f)).then(thenFn, errFn);
    function errFn (err) { // doubles as both uncaught handler and catch
      process.removeListener('uncaughtException', errFn);
      reject(err);
    }
    function thenFn () {
      process.removeListener('uncaughtException', errFn);
      resolve();
    }
  });
  return opts.timeout ? timeLimit(p, opts.timeout) : p;
}

module.exports = function createTestCase (item, opts) {
  return _ => safeWrap(item, opts);
};
