import {
  __ as $,
  both,
  lt,
  nth,
  pipe,
  toPairs,
  groupBy,
  head,
  filter,
  includes,
  reject,
  length,
  chain,
  apply,
  map,
  curry,
  cond,
  propOr,
  equals,
  always as K,
  when
} from 'ramda'
import { trace } from 'xtrace'
import { defined } from './utils'
import { functionDetails } from './function'

const isArray = Array.isArray
const nonEmptyArray = both(isArray, pipe(length, lt(0)))

export const riptestWithConfiguration = curry(
  function _riptestWithConfiguration(
    check,
    claim,
    fn,
    name,
    input,
    output
  ) {
    check(`"${name}": ${functionDetails(fn)}`, () => {
      claim(apply(fn, isArray(input) ? input : [input]), output)
    })
  }
)

export const sameImplementation = curry(function _sameImplementation(
  { riptest, check, claim },
  [a, b],
  name,
  input,
  output
) {
  const [a2, b2] = map(riptest, [a, b])
  a2(name, input, output)
  b2(name, input, output)
  check(
    `same implementation of "${name}": (${functionDetails(
      a
    )}) and (${functionDetails(b)})`,
    () => claim(a(input), b(input))
  )
})

export const sameInterface = curry(function _sameInterface(
  { riptest, check, claim },
  [a, b],
  name,
  structure
) {
  pipe(
    chain(toPairs),
    groupBy(head),
    when(
      () => nonEmptyArray(structure.only),
      filter(([[x]]) => includes(x, structure.only))
    ),
    when(
      () => nonEmptyArray(structure.skip),
      reject(([[x]]) => includes(x, structure.skip))
    ),
    reject(pipe(length, equals(1))),
    map(map(nth(1))),
    toPairs,
    filter(([k, v]) =>
      pipe(propOr(false, k), raw =>
        raw
          ? sameImplementation(
              { riptest, check, claim },
              v,
              k + ': ' + name,
              raw[0],
              raw[1]
            )
          : claim(
              `No matching answer key given for shared interface: ${k}`,
              false
            )
      )(structure)
    )
  )([a, b])
})

export function hook() {
  /* istanbul ignore else */
  if (defined(test) && defined(expect)) {
    const jestBinaryAssert = (a, b) => expect(a).toEqual(b)
    const riptest = riptestWithConfiguration(test, jestBinaryAssert)
    const structure = {
      riptest,
      check: test,
      claim: jestBinaryAssert
    }
    return {
      riptest,
      same: sameImplementation(structure),
      shared: sameInterface(structure)
    }
  }
}
