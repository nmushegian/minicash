// valid-in-context

export {
    vinx_tick,
    vinx_tack,
    vinx_tock,
    _checksig, // prefer vinx_tick
}

import {
    Okay, okay, pass, fail, need, toss, aver,
    Bnum, bnum, bleq, mash, roll, t2b,
    Cash, Byte, Work, Fees, Code, Pubk, tuff,
    scry, addr,
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

function _checksig(tick :Tick, i :number, lock :Code) :boolean {
    let [moves, ments] = tick
    let move = moves[i] // just the ment that is signed
    let sign = move[2]
    move[2] = t2b('')   // replace sign with emptyblob
    let mask = roll([
        t2b("minicash movement"),
        [ move ],  // blob[][]
        ments      // blob[][]
    ])
    let pubk = scry(mask, sign)
    let code = addr(pubk)
    need(bleq(code, lock), `bad code: ${code}, should match ${addr}`)
    return true
}

// context is set of ticks that contain ments being moved
// do not worry about internal consistency of context at this step
// returns total fees if ok
function vinx_tick(conx :Tick[], tick :Tick) :Okay<Fees> {
    // conx all are well-formed
    // tick is well-formed
    // let [ticash, tocash] = [0, 0]
    // for each (i,move) in tick.moves
    //   let txin, indx, sign = move
    //   let intx = find(x in conx | mash(x) == txin)
    //   let ment = intx.ments[indx]
    //   let [code, icash] = ment
    //   need _checksig(tick, i, code)
    //   ticash += icash
    // for each (i,ment) in tick.ments
    //   tocash += ment.cash
    // return pass(tocash - ticash)
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
function vinx_tack(tock :Tock, tack :Tack) {
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

