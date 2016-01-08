const createTestCase = require('./index')

const errHandle = e => console.log(e.stack) && process.exit(1)
const shouldReject = () => console.log((new Error('should have rejected')).stack) && process.exit(1)

const good = [
  createTestCase(() => {})(),
  createTestCase(() => 'foo')(),
  createTestCase(() => Promise.resolve())(),
  createTestCase(() => Promise.resolve('foo'))(),
  createTestCase(Promise.resolve())(),
  createTestCase(Promise.resolve('foo'))()
]

const bad = [
  createTestCase(Promise.reject('foo'))(),
  createTestCase(() => Promise.reject('foo'))(),
  createTestCase(() => { throw new Error('foo') })(),
  createTestCase(() =>
    new Promise(() => {
      process.nextTick(() => {
        throw new Error('foo')
      })
    })
  )()
].map(p => p.then(shouldReject, () => {}))

Promise.all([
  Promise.all(good),
  Promise.all(bad)
]).catch(errHandle)
