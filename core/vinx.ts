// valid-in-context

import {
    Okay, pass, fail,
    Cash, Byte, Work, Fees,
    Tick, Tock, Tack,
} from './word.js'

import {
    Rock
} from './rock.js'

export {
    vinx_tick,
    vinx_tack,
    vinx_tock,
}

// context is set of ticks that contain ments being moved
// do not worry about internal consistency of context at this step
// returns total fees if ok
function vinx_tick(rock :Rock, tick :Tick) :Okay<Cash> {
    // let conx = rock.read ...
    // conx all are well-formed
    // tick is well-formed
    // let fees = 0
    // for each (i,move) in tick.moves
    //   let txin, indx, sign = move
    //   let intx = find(x | mash(x) == txin)
    //   let ment = intx.ments[indx]
    //   let [code, cash] = ment
    //   checksig(tick, i, code) for i in len(inputs):
    //     let [ins, outs] = tick
    //     let [intx, indx, sign] = ins[i]
    //     let mask = [ [intx,indx,""], outs ]
    //     let pubk = scry(mask, sign)
    //     need code == addr(pubk)
    //   fees += incash
    // for each (i,ment) in tick.ments
    //   fees -= ment.cash
    // return pass(fees)
    return fail('todo vinx_tick')
}

// vinx_tack is technically a well-formed check, because all information
// is present in the structure. However, we imagine it as a valid-in-context
// check, for several reasons. First, it is really a response to a tockhash,
// so the tock in theory could be excluded from the response. That would imply
// there has to be a vinx check to ensure the root is part of the tock specified.
// Second, it is a crypto-heavy operation that makes sense to group conceptually
// with the other crypto-related checks.
// We include tock explicitly as a separate argument as guidance for other systems.
// Returns total fees for this tack.
function vinx_tack(rock :Rock, tack :Tack) :Okay<Fees> {
    return fail(`todo vinx_tack`)
}

// context is previous tock
// returns *marginal* work, the number you sum to get cumulative work
function vinx_tock(rock :Rock, tock :Tock) :Okay<Work> {
    // prev is well-formed
    // tock is well-formed
    // tock.prev = prev (this defines the context)
    // work = tuff(hash(tock))
    // return pass(work)
    return fail('todo')
}

