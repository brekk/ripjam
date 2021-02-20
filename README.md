# ripjam

**Tools for breaking things down and building them back up**

## Testing

Use `ripjam/test` if you want to make re-usable testing (with curried parameters) easier.

By default it is designed to work out of the box with `jest` but it's very easy to use with other testing frameworks.

```js
// test.spec.js
import { curry } from 'ramda'
import { hook } from 'ripjam/test'

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

const answers = {
  basic: [100, 200],
  a: ['yo', 'dope: yo']
}

shared(
  [oldImplementation, newImplementation],
  'test all the shared functionality',
  answers
)
```

After running `jest` on the above, it will print:

```
PASS test.spec.js
  ✓ "basic test": 𝞴 "basic" (unary) (2 ms)
  ✓ "basic test with array params": 𝞴 "basic" (unary)
  ✓ "double": 𝞴 unnamed (unary)
  ✓ "double": 𝞴 "basic" (unary)
  ✓ same implementation of "double": (𝞴 unnamed (unary)) and (𝞴 "basic" (unary)) (1 ms)
  ✓ "basic: test all the shared functionality": 𝞴 "basic" (unary)
  ✓ "basic: test all the shared functionality": 𝞴 unnamed (unary)
  ✓ same implementation of "basic: test all the shared functionality": (𝞴 "basic" (unary)) and (𝞴 unnamed (unary))
  ✓ "a: test all the shared functionality": 𝞴 "a" (unary) (1 ms)
  ✓ "a: test all the shared functionality": 𝞴 "a" (unary)
  ✓ same implementation of "a: test all the shared functionality": (𝞴 "a" (unary)) and (𝞴 "a" (unary))
```

## Exclusive / specific interface testing

If the `shared` is given two implementations like the above and the `answers` object is missing an expected value, this will throw an error, unless you add a specific `only` or `skip` array to your answers object, e.g.

```js
const answers = {
  basic: [100, 200],
  a: ['yo', 'dope: yo']
  only: ['a'], // test only the 'a' interface on both objects
  skip: ['basic'] // do not test the 'basic' interface on both objects (not needed here as `only` above does the same)
}

shared(
  [oldImplementation, newImplementation],
  'test all the shared functionality',
  answers
)
```

### Custom testing hook

If you would like to use a different testing framework, you can manually assemble the same behavior like so:
```js
// custom-ripjam.js
import { riptestWithConfiguration, sameImplementation, sameInterface } from 'ripjam/test'

// you supply these
const binaryTestingFunction = (str, run) => test(str, run)
const binaryAssertionFunction = (input, output) => expect(input).toEqual(output)

const customhook = () => {
  const riptest = riptestWithConfiguration(binaryTestingFunction, binaryAssertionFunction)
  const config = {riptest, check: binaryTestingFunction, claim: binaryAssertionFunction}
  const same = sameImplementation(config)
  const shared = sameInterface(config)
  return { riptest, same, shared }
}

export const hook = customhook
```

Now you can use the above file instead of `ripjam/test` and it should be identical.
