import { curry } from 'ramda'
import { hook } from './testing-tools'

const { riptest, same } = hook()

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
