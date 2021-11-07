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
import { complextrace } from 'envtrace'
import { isFuture, ap, resolve } from 'fluture'

import { fork } from './future'
import { defined } from './utils'
import { functionDetails } from './function'

const debug = complextrace('ripjam', [
  'hook',
  'riptestWithConfiguration',
  'sameImplementation',
  'sameInterface',
  'temporalDetails'
])

const isArray = Array.isArray
const nonEmptyArray = both(isArray, pipe(length, lt(0)))

const autobox = unless(isArray, of)

const isPromise = x => x && x.then && x.catch

const temporalDetails = x => {
  debug.temporalDetails('input', x)
  const future = isFuture(x)
  const synchronous = !isPromise(x) && !future
  const output = { future, synchronous }
  debug.temporalDetails('output', output)
  return output
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
      debug.riptestWithConfiguration('input', {
        fn,
        name,
        input,
        expected
      })
      const finish = () => done()
      const applied = autobox(input)

      debug.riptestWithConfiguration('arguments', applied)
      const rawOutput = apply(fn, applied)
      debug.riptestWithConfiguration('rawOutput', rawOutput)
      const { future, synchronous } = temporalDetails(rawOutput)
      if (synchronous) {
        claim(rawOutput, expected)
        return done()
      } else {
        const assertValue = pipe(
          debug.riptestWithConfiguration('async output'),
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
      debug.sameImplementation('input', { name, input, output })
      const finish = () => done()
      const applied = autobox(input)
      const outputA = apply(a, applied)
      const outputB = apply(b, applied)
      debug.sameImplementation('rawOutputs', {
        a: outputA,
        b: outputB
      })
      const [
        { future: aF, synchronous: aS },
        { future: bF, synchronous: bS }
      ] = map(temporalDetails)([outputA, outputB])
      claim(aF, bF)
      claim(aS, bS)
      // synchronous?
      if (!aS && !bS) {
        // future?
        if (aF && bF) {
          fork(
            done,
            ({ x, y }) => {
              debug.sameImplementation('future output', { x, y })
              claim(x, y)
              done()
            },
            ap(outputA)(ap(outputB)(resolve(x => y => ({ x, y }))))
          )
        } else {
          // promise
          outputA
            .then(aRaw =>
              outputB.then(bRaw => {
                debug.sameImplementation('async output', {
                  x: aRaw,
                  y: bRaw
                })
                claim(aRaw, bRaw)
              })
            )
            .then(finish)
        }
        return
      }
      claim(outputA, outputB)
      done()
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
    debug.sameInterface('input'),
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
  debug.hook('preparing to ripjam', '💀jam')
  /* istanbul ignore next */
  if (!testAndExpectDefined()) {
    debug.hook('Unable to find test or expect', { test, expect })
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
