# create-test-promise

Creates a function that returns a promise whose resultant state is dependent on
whether the included code throws or rejects.

You can pass in a any of the folloing:

* a Promise
* a function taking 0 arguments that returns a Promise
* a function taking 0 arguments that either throws or doesn't
* a function taking 1 argument, a callback, that fails when passed an argument
in the callback.

You can pass in a second parameter, an options object, with the following option
property:

* **`timeout`**: number of milliseconds after which to time the test out.
  Default is `Infinity`.

## Examples

```js
const test = require('create-test-promise')
function shouldFail () {
  throw new Error('this one should have failed')
}
function noop () {}

Promise.all([
  test(function () {})(),
  test(function () {
    throw new Error('foo')
  })().then(shouldFail, noop),
  test(Promise.resolve())(),
  test(Promise.reject(new Error('foo')))().then(shouldFail, noop),
  test(function () {
    return Promise.resolve()
  })(),
  test(function () {
    return Promise.reject(new Error('foo'))
  })().then(shouldFail, noop),
  test(function (cb) {
    cb()
  })(),
  test(function (cb) {
    cb(new Error('foo'))
  })().then(shouldFail, noop),
  test(function (cb) {
    setTimeout(cb, 10)  
  }, { timeout: 100 })
]).catch(function(e){
  console.error(e.stack)
  console.error('none of these should have failed!')
  process.exit(1)
})
```

## License

See LICENSE.txt
