# ripjam

**Tools for breaking things down and building them back up**

## Testing

Use `ripjam/test` if you want to make re-usable testing (with curried parameters) easier.

By default it is designed to work out of the box with `jest` but it's very easy to use with other testing frameworks.

```js
// test.spec.js
import { curry } from 'ramda'
import { hook } from 'ripjam/test'

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
```

After running `jest` on the above, it will print:

```
 PASS  test.spec.js
  ✓ "basic test": 𝞴 "basic" (unary) (2 ms)
  ✓ "basic test with array params": 𝞴 "basic" (unary)
  ✓ "double": 𝞴 unnamed (unary) (1 ms)
  ✓ "double": 𝞴 "basic" (unary)
  ✓ same implementation of "double": (𝞴 unnamed (unary)) and (𝞴 "basic" (unary))
```

### Custom testing hook

If you would like to use a different testing framework, you can manually assemble the same behavior like so:
```
// custom-ripjam.js
import { riptestWithConfiguration } from 'ripjam/test'

// you supply these
const binaryTestingFunction = (str, run) => test(str, run)
const binaryAssertionFunction = (input, output) => expect(input).toEqual(output)

const customhook = () => {
  const riptest = riptestWithConfiguration(binaryTestingFunction, binaryAssertionFunction)
  const same = sameImplementation({riptest, check: binaryTestingFunction, claim: binaryAssertionFunction})
  return {riptest, same}
}

export const hook = customhook
```

Now you can use the above file instead of `ripjam/test` and it should be identical.
