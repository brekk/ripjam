import { pipe, map, curry, andThen } from 'ramda'
import { resolve as fResolve } from 'fluture'
import {
  testAndExpectDefined,
  sameInterface,
  hook
} from './testing-tools'

expect(testAndExpectDefined()).toBeTruthy()

const { riptest, same, shared } = hook()

function basic(x) {
  return x * 2
}

const testBasic = riptest(basic)

testBasic('basic test', 1, 2)
testBasic('basic test with array params', [1], 2)

const testAsyncPromise = riptest(pipe(y => y.then(basic)))
testAsyncPromise('basic async test', Promise.resolve(1), 2)

const testAsyncFuture = riptest(map(basic))
testAsyncFuture('basic async future test', fResolve(1), 2)

const mult = curry(function _multiply(a, b) {
  return a * b
})

same([mult(2), basic], 'double', 100, 200)
same([map(mult(2)), map(basic)], 'double future', fResolve(100), 200)
same(
  [andThen(mult(2)), andThen(basic)],
  'double promise',
  Promise.resolve(100),
  200
)

const oldImplementation = {
  binaryFunction: curry((a, b) => a + b),
  basic,
  a: z => 'dope: ' + z,
  skippable: x => x * x,
  basicMap: map(basic)
}
const newImplementation = {
  basic: mult(2),
  complex: mult(-2),
  a: x => ['dope:', x].join(' '),
  skippable: y => y * y * y,
  binaryFunction: curry((a, b) => a + b),
  basicMap: map(mult(2))
}

const testLens = shared([oldImplementation, newImplementation])

testLens('test all the shared functionality', {
  basic: [100, 200],
  basicMap: [fResolve(100), 200],
  a: ['yo', 'dope: yo'],
  skip: ['skippable', 'binaryFunction']
})

testLens('test only the shared implementation of basic', {
  basic: [100, 200],
  a: ['yo', 'dope: yo'],
  only: ['basic']
})

testLens('binary functions can be passed an array input', {
  only: ['binaryFunction'],
  binaryFunction: [[3, -2], 1]
})

sameInterface(
  {
    riptest,
    check: test,
    claim: curry((a, b) =>
      expect(a).toEqual(
        'No matching answer key given for shared interface: a'
      )
    )
  },
  [{ a: x => x }, { a: x => x }],
  "sameInterface will assert an error when there's no matching answer found",
  {}
)
