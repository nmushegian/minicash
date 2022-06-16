// valid-in-context

export {
    vinx_tick,
    vinx_tack,
    vinx_tock,
}

import {
    Okay, okay, pass, fail, need, toss, aver,
    Bnum, bnum, bleq, mash, roll,
    Cash, Byte, Work, Fees, tuff,
    Tick, Tock, Tack,
} from './word.js'

import {
    Rock
} from './rock.js'

// aver
import {
    form_tick,
    form_tack,
    form_tock,
} from './well.js'

// context is set of ticks that contain ments being moved
// do not worry about internal consistency of context at this step
// returns total fees if ok
function vinx_tick(conx :Tick[], tick :Tick) :Okay<Fees> {
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
function vinx_tack(tock :Tock, tack :Tack) :Okay<Fees> {
    return fail(`todo vinx_tack`)
}

// context is previous tock
// returns *marginal* work, the number you sum to get cumulative work
function vinx_tock(prev :Tock, tock :Tock) :Okay<Work> {
    aver(_=> {
        okay(form_tock(prev))
        okay(form_tock(tock))
        need(bleq(tock[0], mash(roll(prev))), `panic, bad vinx_tock context`)
        return true
    }, `vinx_tock precondition`)

    let thistime = bnum(tock[2])
    let prevtime = bnum(prev[2])
    need(BigInt(57) == thistime - prevtime, `bad header time`)
    let work = tuff(mash(roll(tock)))
    return pass(work)
}

