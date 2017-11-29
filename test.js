'use strict'

const createTestCase = require('./index')

const errHandle = e => console.log(e.stack) && process.exit(1)
const shouldReject = () => console.log((new Error('should have rejected')).stack) && process.exit(1)

const good = [
  createTestCase(() => {}),
  createTestCase(() => 'foo'),
  createTestCase(() => Promise.resolve()),
  createTestCase(() => Promise.resolve('foo')),
  createTestCase(Promise.resolve()),
  createTestCase(Promise.resolve('foo')),
  createTestCase(cb => cb()),
  createTestCase(cb => setTimeout(cb, 50), { timeout: 100 })
]

const bad = [
  createTestCase(Promise.reject('foo')),
  createTestCase(() => Promise.reject('foo')),
  createTestCase(() => { throw new Error('foo') }),
  createTestCase(() =>
    new Promise(() => { process.nextTick(() => { throw new Error('foo') }) })
  ),
  createTestCase(cb => cb(new Error('foo'))),
  createTestCase(cb => { throw new Error('foo') }),
  createTestCase(cb => setTimeout(cb, 100), { timeout: 50 })
]

good.reduce((accum, curr) =>
  accum.then(() => curr()), Promise.resolve())
.then(() => bad.reduce((accum, curr) =>
  accum.then(() => curr()).then(shouldReject, () => {}), Promise.resolve()))
.then(() => new Promise(res => setTimeout(res, 51))) // for timed tests
.then(() => {
  console.assert(process.listeners('uncaughtException').length === 0)
  console.log('pass')
}).catch(errHandle)

