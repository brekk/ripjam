import { curry, cond, equals, always as K } from 'ramda'

export const arity = cond([
  [equals(0), K('nullary')],
  [equals(1), K('unary')],
  [equals(2), K('binary')],
  [equals(3), K('ternary')],
  [equals(4), K('quaternary')],
  [equals(5), K('quinary')],
  [equals(6), K('senary')],
  [equals(7), K('septenary')],
  [equals(8), K('octonary')],
  [equals(9), K('novenary')],
  [K(true), K(false)]
])

export const functionDetails = curry(
  fn =>
    `𝞴 ${fn.name ? '"' + fn.name + '"' : 'unnamed'} (${arity(
      fn.length
    )})`
)
