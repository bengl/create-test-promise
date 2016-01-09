/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
'use strict'

function isFunction (f) {
  return typeof f === 'function'
}

function isPromise (p) {
  return typeof p === 'object' && isFunction(p.then)
}

function safeWrap (f) {
  let e
  function uncaughtException (err) {
    e = err
  }
  process.on('uncaughtException', uncaughtException)
  return Promise.resolve().then(f)
  .then(function handlePotentialUncaughtException (thing) {
    process.removeListener('uncaughtException', uncaughtException)
    if (e) throw e
  })
}

module.exports = function createTestCase (item) {
  return function () {
    if (isPromise(item)) {
      return item
    } else if (isFunction(item)) {
      return safeWrap(item)
    }
  }
}
