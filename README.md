# create-test-promise

Creates a function that returns a promise whose resultant state is dependent on
whether the included code throws or rejects.

You can pass in a any of the folloing:

* a Promise
* a function taking 0 arguments that returns a Promise
* a function taking 0 arguments that either throws or doesn't
* a function taking 1 argument, a callback, that fails when passed an argument
in the callback.

You should always run multiple test cases *sequentially*. This may seem
counter-intuitive, but this is needed in order for the provided
`'uncaughtException'` and `'unhandledRejection'` handlers to behave in sensible
ways. Otherwise it's nearly impossible to tell which test case an error came
from.

> Note: Be careful about `process.on('unhandledRejection')`. A test may conclude
successfully, but still have an unhandled rejection hanging around. You should
have a handler that encompasses your entire test suite, and fails it in such
situations.

## Examples

```js
const test = require('create-test-promise')
function shouldFail () {
  throw new Error('this one should have failed')
}
function noop () {}
function series (list) {
  if (!list.length) return Promise.resolve()
  return list.shift()().then(() => promiseSeries(list))
}

series([
  () => test(function () {})(),
  () => test(function () {
    throw new Error('foo')
  })().then(shouldFail, noop),
  () => test(Promise.resolve())(),
  () => test(Promise.reject(new Error('foo')))().then(shouldFail, noop),
  () => test(function () {
    return Promise.resolve()
  })(),
  () => test(function () {
    return Promise.reject(new Error('foo'))
  })().then(shouldFail, noop),
  () => test(function (cb) {
    cb()
  })(),
  () => test(function (cb) {
    cb(new Error('foo'))
  })().then(shouldFail, noop)
]).catch(function(e){
  console.error(e.stack)
  console.error('none of these should have failed!')
  process.exit(1)
})
```

## License

See LICENSE.txt
