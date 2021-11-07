export { Future, isFuture } from 'fluture'
import { fork as spoon } from 'fluture'
import { curry } from 'ramda'

export const fork = curry((bad, good, f) => spoon(bad)(good)(f))
