import { apply, map, curry, cond, equals, always as K } from 'ramda'
import { defined } from './utils'
import { functionDetails } from './function'

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
      claim(apply(fn, Array.isArray(input) ? input : [input]), output)
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

export function hook() {
  /* istanbul ignore else */
  if (defined(test) && defined(expect)) {
    const jestBinaryAssert = (a, b) => expect(a).toEqual(b)
    const riptest = riptestWithConfiguration(test, jestBinaryAssert)
    return {
      riptest,
      same: sameImplementation({
        riptest,
        check: test,
        claim: jestBinaryAssert
      })
    }
  }
}
