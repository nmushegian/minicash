// valid-in-context

import {
    Okay, pass, fail,
    Bnum,
    Tick, Tock
} from './type.js'

export {
    vinx_tock,
    vinx_tick
}

// context is set of ticks that contain bills being moved
// do not worry about internal consistency of context at this step
// returns total fees if ok
function vinx_tick(conx : Tick[], tick : Tick) : Okay<Bnum> {
    // conx all are well-formed
    // tick is well-formed
    // let fees = 0
    // for each (i,move) in tick.moves
    //   let txin, indx, sign = move
    //   let intx = find(x | mesh(x) == txin)
    //   let bill = intx[indx]
    //   let [inhash, incash] = bill
    //   checksig(tick, i, bill)
    //   fees += incash
    // for each (i,bill) in tick.bills
    //   fees -= outcash
    // return pass(fees)
    return fail('todo')
}

// context is previous tock
// returns *marginal* work, the number you sum to get cumulative work
function vinx_tock(prev : Tock, tock : Tock) : Okay<Bnum> {
    // prev is well-formed
    // tock is well-formed
    // tock.prev = prev (this defines the context)
    // work = tuff(hash(tock))
    // return pass(work)
    return fail('todo')
}
