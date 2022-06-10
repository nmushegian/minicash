import {
  Okay, pass, fail,
  Roll
} from 'coreword'

import { Tick, Tock } from './type'

export {
  tock_form
}

function tock_form(x :Roll) :Okay<Tock> {
  if (!Array.isArray(x))
    return fail(`not an array`)
  if (x.length !== 4)
    return fail(`length is not 4`)
  // all 4 items are blob len 32
  return fail(`todo`)
}

function tick_form(x :Roll) :Okay<Tick> {
// tick_form
//   2 lists of max len 7, not both empty
//   list 0 is all [utxo,sign]
//     utxo: blob len 33, last byte is 00-06
//     sign: blob len 32
//   list 1 is all [hash,cash]
//     hash: blob len 32
//     cash: blob len 7, max 2^53-1
  return fail(`todo`)
}
