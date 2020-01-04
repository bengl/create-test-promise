/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
'use strict';

const isFunction = f => typeof f === 'function';
const isPromise = p => typeof p === 'object' && isFunction(p.then);

const promisify = f => () =>
  new Promise((resolve, reject) => f(err => err ? reject(err) : resolve()));

const timeLimit = (promise, t) =>
  // We can time out a promise using Promise.race and a promise that rejects
  // after the interval. If a test takes too long, the rejection will win the
  // race.
  Promise.race([
    promise,
    new Promise((resolve, reject) =>
      setTimeout(_ => reject(new Error(`Test timed out (${t}ms)`)), t)
    )
  ]);

function safeWrap (f, opts = {}) {
  let p = f;
  if (!isPromise(f)) { // If it's not already a promise, we need to make one.
    if (f.length) { // If the fn has a length, it's callbackish, so promisfy.
      f = promisify(f);
    }
    // We need this wrapper promise because we need a way of rejecting due to
    // the `uncaughtException` handler.
    p = new Promise((resolve, reject) => {
      // We'll set this uncaught exception handler to deal with any deferred
      // execution that still might happen before the promise fullfills.
      process.on('uncaughtException', errFn);
      // This bit does almost everything. We've already got a function `f` that
      // returns a promise, but if anything throws in the initial Promise, or in
      // the function itself, then there's nothing to catch it. By wrapping it
      // in an async, we're catching anything that's either thrown or rejected,
      // using `errFn`.
      (async () => f())().then(thenFn, errFn);
      // In either the success or failure case, we need to first remove the
      // `uncaughtException` handler. Because of that, we have these wrapper
      // functions around `resolve` and `reject`.
      function errFn (err) { // doubles as both uncaught handler and catch
        process.removeListener('uncaughtException', errFn);
        reject(err);
      }
      function thenFn () {
        process.removeListener('uncaughtException', errFn);
        resolve();
      }
    });
  }
  // If we're doing timeouts, do the timeout race as described in the function
  // above. Otherwise we can just return the promise.
  return opts.timeout ? timeLimit(p, opts.timeout) : p;
}

module.exports = function createTestCase (item, opts) {
  return _ => safeWrap(item, opts);
};
