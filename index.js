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

const timeLimit = (p, t) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Test timed out (${t}ms)`))
    }, t)
    p.then(resolved => {
      clearTimeout(timeout)
      resolve(resolved)
    }, err => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

function safeWrap (f, opts = {}) {
  const p = isPromise(f) ? f : new Promise((resolve, reject) => {
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
  return opts.timeout ? timeLimit(p, opts.timeout) : p
}

module.exports = function createTestCase (item, opts) {
  return function () {
    return safeWrap(item, opts)
  }
}
