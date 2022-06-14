// valid-in-context

import {
    Okay, pass, fail,
    Bnum,
    Tick, Tock, Tack,
} from './word.js'

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
    //   let intx = find(x | mash(x) == txin)
    //   let bill = intx[indx]
    //   let [inhash, incash] = bill
    //   checksig(tick, i, inhash) for i in len(inputs):
    //     let [ins, outs] = tick
    //     let [intx, indx, sign] = ins[i]
    //     let mask = [ [intx,indx,""], outs ]
    //     let pubk = scry(mask, sign)
    //     let lock = mosh(pubk)
    //     need lock == inhash
    //   fees += incash
    // for each (i,bill) in tick.bills
    //   fees -= outcash
    // return pass(fees)
    return fail('todo')
}

// context is previous tock
// returns *marginal* work, the number you sum to get cumulative work
function vinx_tock(prev :Tock, tock :Tock) : Okay<Bnum> {
    // prev is well-formed
    // tock is well-formed
    // tock.prev = prev (this defines the context)
    // work = tuff(hash(tock))
    // return pass(work)
    return fail('todo')
}

// vinx_tack is technically a well-formed check, because all information
// is present in the structure. However, we imagine it as a valid-in-context
// check, for several reasons. First, it is really a response to a tockhash,
// so the tock in theory could be excluded from the response. That would imply
// there has to be a vinx check to ensure the root is part of the tock specified.
// Second, it is a crypto-heavy operation that makes sense to group conceptually
// with the other crypto-related checks.
// It returns which index this tack corresponds to in the tock.
// We include tock explicitly as a separate argument as guidance for other systems.
function vinx_tack(tock :Tock, tack :Tack) :Okay<Bnum> {
    return fail(`todo`)
}
