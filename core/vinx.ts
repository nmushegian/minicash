// valid-in-context

import {b2t, Roll} from "coreword";

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
    Tick, Tock, Tack, b2h,
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
    return bleq(code, lock)
}

// context is set of ticks that contain ments being moved
// do not worry about internal consistency of context at this step
// returns total fees if ok
function vinx_tick(conx :Tick[], tick :Tick) :Okay<Fees> {
    try {
        conx.forEach(x => form_tick(x as Roll))
        form_tick(tick)

        const moves = tick[0]
        let ticash = BigInt(0)
        moves.forEach((move, moveidx) => {
            const [txin, indx, sign] = move
            const intx = conx.find(x => mash(roll(x)).equals(txin)) // stupid
            need(intx != undefined, 'unmatched txin')
            const indxnum = Number('0x'+b2h(indx))
            const iments  = intx[1]
            need(indxnum < iments.length, 'indx out of bounds')
            const iment = intx[1][Number(indxnum)]
            const [icode, icash] = iment
            need(_checksig(tick, moveidx, icode), 'bad signature')
            ticash += BigInt('0x' + b2h(icash))
        })

        const ments = tick[1]
        let tocash = BigInt(0)
        ments.forEach((ment, mentidx) => {
            const cash = ment[1]
            tocash += BigInt('0x' + b2h(cash))
        })
        need(tocash <= ticash, 'input cash less than output cash')
        return pass(tocash - ticash)
    } catch (e) {
        return fail(e.message)
    }
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
    // let [head, eye, ribs, feet] = tack

    // aver head == tock      // defines the context
    // aver len(ribs) <= 128  // well formed
    // aver len(feet) <= 2^17 // well formed

    // if len(ribs) == 0 {
    //   need eye == 0
    //   need len(feet) < 1024
    //   need merk(feet) == tock.root
    // } else { // ribs len > 0
    //   need len(ribs) = ceil( len(feet) / 1024 )
    //   for (let i = 0; i < len(ribs); i++) {
    //      let ticks = feet.slice(i, i+1024)
    //      need merk(ticks) == ribs[i + eye]
    //   }
    //   need merk(ribs) == tock.root
    // }
    // need tock.root == merk(tack.feet)

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

