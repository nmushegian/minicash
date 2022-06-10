import {
  Okay, pass, fail,
  Roll
} from 'coreword'

import { Tock } from './type'

export {
  tock_form
}

function tock_form(x :Roll) :Okay<Tock> {
  if (!Array.isArray(x))
    return fail(x, `not an array`)
  if (x.length !== 4)
    return fail(x, `length is not 4`)
  // item 0 is blob
  // item 0 len 32
  // ...
  // item 3 len 32
  return pass(x)
}

