'use strict';

const createTestCase = require('./index');

const good = [
  createTestCase(() => {}),
  createTestCase(() => 'foo'),
  createTestCase(() => Promise.resolve()),
  createTestCase(() => Promise.resolve('foo')),
  createTestCase(Promise.resolve()),
  createTestCase(Promise.resolve('foo')),
  createTestCase(cb => cb()),
  createTestCase(cb => setTimeout(cb, 50), { timeout: 100 })
];

const rejecting = Promise.reject(new Error('foo'));
rejecting.catch(() => { /* avoid unhandled rejection warnings */ });

function nextTick (fn) {
  if (typeof window !== 'undefined') {
    window.queueMicrotask(fn);
  } else {
    process.nextTick(fn);
  }
}

const bad = [
  createTestCase(rejecting),
  createTestCase(() => rejecting),
  createTestCase(() => { throw new Error('foo'); }),
  createTestCase(() =>
    new Promise(() => { nextTick(() => { throw new Error('foo'); }); })
  ),
  createTestCase(cb => cb(new Error('foo'))),
  createTestCase(cb => { throw new Error('foo'); }),
  createTestCase(cb => setTimeout(cb, 100), { timeout: 50 })
];

(async () => {
  for (const goodCase of good) {
    await goodCase();
    console.count('good');
  }

  for (const badCase of bad) {
    let err;
    try {
      await badCase();
    } catch (e) {
      console.count('bad');
      err = e;
    }
    if (!err) {
      throw new Error('should have rejected');
    }
  }

  await new Promise(resolve => setTimeout(resolve, 51)); // for timed tests
  if (typeof window === 'undefined') {
    // TODO is there a way of checking this in browsers?
    console.assert(process.listeners('uncaughtException').length === 0);
  }
  console.log('pass');
  setExitCode(0);
})().catch(e => {
  console.log(e.stack);
  setExitCode(1);
});

function setExitCode (code) {
  if (typeof window !== 'undefined') {
    window.exitCode = code;
  } else {
    process.exitCode = code;
  }
}
