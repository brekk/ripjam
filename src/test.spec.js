import { curry } from 'ramda'
import { hook } from './testing-tools'

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

const oldImplementation = { basic, a: z => 'dope: ' + z }
const newImplementation = {
  basic: mult(2),
  complex: mult(-2),
  a: x => ['dope:', x].join(' ')
}

shared(
  [oldImplementation, newImplementation],
  'test all the shared functionality',
  { basic: [100, 200], a: ['yo', 'dope: yo'] }
)
