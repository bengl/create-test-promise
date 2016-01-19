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
  return new Promise((resolve, reject) => {
    let deListen = () => process.removeListener('uncaughtException', errHandle)
    function errHandle (err) { // doubles as both uncaught handler and catch
      deListen()
      reject(err)
    }
    function thenHandle () {
      deListen()
      resolve()
    }
    process.on('uncaughtException', errHandle)
    Promise.resolve().then(f).then(thenHandle, errHandle)
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
