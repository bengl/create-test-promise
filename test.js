const createTestCase = require('./index')

const errHandle = e => console.log(e.stack || e, '\nfail') && process.exit(1)
const shouldReject = () => { throw new Error('should have rejected') }

const good = [
  createTestCase(() => {}),
  createTestCase(() => 'foo'),
  createTestCase(() => Promise.resolve()),
  createTestCase(() => Promise.resolve('foo')),
  createTestCase(Promise.resolve()),
  createTestCase(Promise.resolve('foo')),
  createTestCase(cb => cb())
]

const bad = [
  createTestCase(Promise.reject(Error('foo'))),
  createTestCase(() => Promise.reject(Error('foo'))),
  createTestCase(() => {
    Promise.reject(Error('foo'))
    return new Promise((resolve) => { setImmediate(resolve) })
  }),
  createTestCase(() => { throw new Error('foo') }),
  createTestCase(() =>
    new Promise(() => { process.nextTick(() => { throw Error('foo') }) })
  ),
  createTestCase(cb => cb(Error('foo'))),
  createTestCase(cb => { throw Error('foo') })
]

function runAll (list, bad) {
  if (!list.length) return Promise.resolve()
  const item = list.shift()
  const p = item()
  return (bad ? p.then(shouldReject, () => {}) : p).then(() => runAll(list, bad))
}

runAll(good).then(() => runAll(bad, true)).then(() => {
  console.assert(process.listeners('uncaughtException').length === 0)
  console.assert(process.listeners('unhandledRejection').length === 0)
  console.log('pass')
}).catch(errHandle)

