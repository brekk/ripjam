import { curry } from 'ramda'
import { sameInterface, hook } from './testing-tools'

const { riptest, same, shared } = hook()

function basic(x) {
  return x * 2
}

const testBasic = riptest(basic)

testBasic('basic test', 1, 2)
testBasic('basic test with array params', [1], 2)

const mult = curry(function _multiply(a, b) {
  return a * b
})

same([mult(2), basic], 'double', 100, 200)

const oldImplementation = {
  binaryFunction: curry((a, b) => a + b),
  basic,
  a: z => 'dope: ' + z,
  skippable: x => x * x
}
const newImplementation = {
  basic: mult(2),
  complex: mult(-2),
  a: x => ['dope:', x].join(' '),
  skippable: y => y * y * y,
  binaryFunction: curry((a, b) => a + b)
}

const testLens = shared([oldImplementation, newImplementation])

testLens('test all the shared functionality', {
  basic: [100, 200],
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
