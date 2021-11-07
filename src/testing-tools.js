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
  unless,
  of,
  when
} from 'ramda'
import { envtrace } from 'envtrace'
import { isFuture, ap, resolve } from 'fluture'

import { fork } from './future'
import { defined } from './utils'
import { functionDetails } from './function'

const trace = envtrace('ripjam')

const isArray = Array.isArray
const nonEmptyArray = both(isArray, pipe(length, lt(0)))

const autobox = unless(isArray, of)

const isPromise = x => x && x.then && x.catch

const temporalDetails = x => {
  const future = isFuture(x)
  const synchronous = !isPromise(x) && !future
  return { future, synchronous }
}

export const riptestWithConfiguration = curry(
  function _riptestWithConfiguration(
    { check, claim },
    fn,
    name,
    input,
    expected
  ) {
    check(`"${name}": ${functionDetails(fn)}`, done => {
      const finish = () => done()
      const applied = autobox(input)
      const rawOutput = apply(fn, applied)
      const { future, synchronous } = temporalDetails(rawOutput)
      if (synchronous) {
        claim(rawOutput, expected)
        return done()
      } else {
        const assertValue = pipe(
          trace('async assertion'),
          raw => claim(raw, expected),
          finish
        )
        if (future) {
          fork(done, assertValue, rawOutput)
        } else {
          rawOutput.catch(done).then(assertValue)
        }
      }
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
    done => {
      const finish = () => done()
      const applied = autobox(input)
      const aIsTheSame = apply(a, applied)
      const asB = apply(b, applied)
      const { future: aF, synchronous: aS } = temporalDetails(
        aIsTheSame
      )
      const { future: bF, synchronous: bS } = temporalDetails(asB)
      claim(aF, bF)
      claim(aS, bS)
      // synchronous?
      if (!aS && !bS) {
        // future?
        if (aF && bF) {
          fork(
            done,
            ({ x, y }) => {
              claim(x, y)
              done()
            },
            ap(aIsTheSame)(ap(asB)(resolve(x => y => ({ x, y }))))
          )
        } else {
          aIsTheSame
            .then(aRaw => asB.then(bRaw => claim(aRaw, bRaw)))
            .then(finish)
        }
      } else {
        claim(aIsTheSame, asB)
        done()
      }
    }
  )
})

const exclude = curry((match, sifter, raw) =>
  when(
    () => nonEmptyArray(match),
    sifter(([[x]]) => includes(x, match))
  )(raw)
)

export const sameInterface = curry(function _sameInterface(
  config,
  [a, b],
  name,
  structure
) {
  pipe(
    chain(toPairs),
    groupBy(head),
    exclude(structure.only, filter),
    exclude(structure.skip, reject),
    reject(pipe(length, equals(1))),
    map(map(nth(1))),
    toPairs,
    filter(([k, v]) =>
      pipe(propOr(false, k), raw =>
        raw
          ? sameImplementation(
              config,
              v,
              k + ': ' + name,
              raw[0],
              raw[1]
            )
          : config.claim(
              `No matching answer key given for shared interface: ${k}`,
              false
            )
      )(structure)
    )
  )([a, b])
})

export const testAndExpectDefined = () =>
  defined(test) && defined(expect)

export function hook() {
  /* istanbul ignore next */
  if (!testAndExpectDefined()) {
    /* istanbul ignore next */
    throw new Error(
      "Unable to hook without 'test' and 'expect' globals defined. Consider running 'riptestWithConfiguration'?"
    )
  }
  const jestBinaryAssert = (a, b) => expect(a).toEqual(b)
  const config = { check: test, claim: jestBinaryAssert }
  const riptest = riptestWithConfiguration(config)
  const structure = {
    riptest,
    ...config
  }
  return {
    riptest,
    same: sameImplementation(structure),
    shared: sameInterface(structure)
  }
}
