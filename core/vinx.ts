// valid-in-context

import {
    Okay, pass, fail,
    Cash, Byte, Work,
    Tick, Tock, Tack,
} from './word.js'

export {
    vinx_tock,
    vinx_tick
}

// context is set of ticks that contain ments being moved
// do not worry about internal consistency of context at this step
// returns total fees if ok
function vinx_tick(conx : Tick[], tick : Tick) : Okay<Cash> {
    // conx all are well-formed
    // tick is well-formed
    // let fees = 0
    // for each (i,move) in tick.moves
    //   let txin, indx, sign = move
    //   let intx = find(x | mash(x) == txin)
    //   let ment = intx.ments[indx]
    //   let [lock, cash] = ment
    //   checksig(tick, i, lock) for i in len(inputs):
    //     let [ins, outs] = tick
    //     let [intx, indx, sign] = ins[i]
    //     let mask = [ [intx,indx,""], outs ]
    //     let pubk = scry(mask, sign)
    //     need lock == mosh(pubk)
    //   fees += incash
    // for each (i,ment) in tick.ments
    //   fees -= ment.cash
    // return pass(fees)
    return fail('todo')
}

// vinx_tack is technically a well-formed check, because all information
// is present in the structure. However, we imagine it as a valid-in-context
// check, for several reasons. First, it is really a response to a tockhash,
// so the tock in theory could be excluded from the response. That would imply
// there has to be a vinx check to ensure the root is part of the tock specified.
// Second, it is a crypto-heavy operation that makes sense to group conceptually
// with the other crypto-related checks.
// We include tock explicitly as a separate argument as guidance for other systems.
// Returns which tack index this tack corresponds to in this tock
// by examining which neck hash these ticks start at. (Ticks must start at index multiple
// of 1024 and must be 'complete', ie, only the last chunk can be length <1024.
function vinx_tack(tock :Tock, tack :Tack) :Okay<Byte> {
    return fail(`todo`)
}

// context is previous tock
// returns *marginal* work, the number you sum to get cumulative work
function vinx_tock(prev :Tock, tock :Tock) :Okay<Work> {
    // prev is well-formed
    // tock is well-formed
    // tock.prev = prev (this defines the context)
    // work = tuff(hash(tock))
    // return pass(work)
    return fail('todo')
}

