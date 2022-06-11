// valid-in-context

import {
    Okay, pass, fail,
    Bnum,
    Tick, Tock
} from './type.js'

export {
  tick_vinx,
  tock_vinx
}

// context is set of ticks that contain bills being moved
// do not worry about internal consistency of context at this step
// returns total fees if ok
function tick_vinx(conx : Tick[], tick : Tick) : Okay<Bnum> {
    // conx all are well-formed
    // tick is well-formed
    // let fees = 0
    // for each (i,move) in tick.moves
    //   rtxi[00:32] is a txid of a tick in the conx
    //   rtxi[32:33] is the index of an output (not too large)
    //   let utxo = the output being spent
    //   let [inhash, incash] = utxo
    //   checksig(inhash, tick, i)
    //   fees += incash
    // for each (i,bill) in tick.bills
    //   fees -= outcash
    // return pass(fees)
    return fail('todo')
}

// context is previous tock
// returns *marginal* work, the number you sum to get cumulative work
function tock_vinx(prev : Tock, tock : Tock) : Okay<Bnum> {
    // prev is well-formed
    // tock is well-formed
    // tock.prev = prev (this defines the context)
    // work = tuff(hash(tock))
    // return pass(work)
    return fail('todo')
}
