/*
Copyright 2016, Yahoo Inc.
Code licensed under the MIT License.
See LICENSE.txt
*/
'use strict'

const isFunction = f => typeof f === 'function'
const isPromise = p => typeof p === 'object' && isFunction(p.then)

const promisify = f =>
  new Promise((res, rej) => f(err => err ? rej(err) : res()))

function safeWrap (f) {
  if (isPromise(f)) return f
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
    const result = f.length ? promisify(f) : Promise.resolve().then(f)
    result.then(thenHandle, errHandle)
  })
}

module.exports = function createTestCase (item) {
  return function () {
    return safeWrap(item)
  }
}
