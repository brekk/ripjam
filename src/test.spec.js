import { curry } from 'ramda'
import { hook } from './testing-tools'

const { riptest, same } = hook()

function basic(x) {
  return x * 2
}

riptest('basic test', basic, 1, 2)

const mult = curry(function _multiply(a, b) {
  return a * b
})

same('double', [mult(2), basic], 100, 200)
