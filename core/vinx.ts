// valid-in-context

import {b2t, Roll} from "coreword";
import Debug from 'debug'
const debug = Debug('vinx::test')

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
    Tick, Tock, Tack, b2h, merk, rmap
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
    move[2] = sign
    let pubk = scry(mask, sign)
    let code = addr(pubk)
    return bleq(code, lock)
}

// context is set of ticks that contain ments being moved
// do not worry about internal consistency of context at this step
// returns total fees if ok
function vinx_tick(conx :Tick[], tick :Tick, tock? :Tock) :Okay<Fees> {
    try {
        aver(_=> {
            conx.forEach(x => okay(form_tick(x as Roll)))
            okay(form_tick(tick))
            if (tock) {
                okay(form_tock(tock))
            }
            return true
        }, `vinx_tick args not well-formed`)

        const moves = tick[0]
        const ments = tick[1]
        let fees = BigInt(0)

        let ismint = false
        moves.forEach((move, moveidx) => {
            const [txin, indx, sign] = move
            const indxnum = parseInt(b2h(indx), 16)
            if (indxnum == 7) {
                // TODO some can be `aver` based on well-formed check
                need(moves.length == 1, `mint tick must have only 1 move`)
                need(ments.length == 1, `mint tick must have only 1 ment`)
                need(tock != undefined, 'panic: vinx_tick - indx 7 but tock undefined')
                need(bleq(txin, mash(roll(tock))), 'bad prev tock hash')
                ismint = true
                return
            }
            const intx = conx.find( x => bleq(txin, mash(roll(x))) )
            const iments  = intx[1]
            need(indxnum < iments.length, 'indx out of bounds')
            const iment = iments[indxnum]
            const [icode, icash] = iment
            need(_checksig(tick, moveidx, icode), 'bad sign')
            fees += bnum(icash)
        })

        ments.forEach((ment, mentidx) => {
            const cash = ment[1]
            fees -= bnum(cash)
        })

        need(ismint || fees >= 0, `non-mint tick fees must be >= 0`)
        return pass(fees)

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
function vinx_tack(tock :Tock, tack :Tack) :Okay<void> {
    try {
        let [head, eye, ribs, feet] = tack
        let [prev, root, time, fuzz] = tock

        aver(_ => bleq(roll(head), roll(tock)), 'panic: vinx_tack precondition - head tock mismatch')
        aver(_ => ribs.length <= 128, 'panic: vinx_tack precondition - len(ribs) must be <= 128')
        aver(_ => feet.length <= 1024, 'panic: vinx_tack precondition - feet.length must be <= 1024')

        if (ribs.length == 0) {
            need(bnum(eye) == BigInt(0), `eye must be 0 if ribs empty`)
            need(feet.length < 512, `len(feet) must be <512 if ribs empty`)
            need(bleq(merk(feet), root), 'merkelization failed')
        } else { // ribs len > 0
            const eyenum = parseInt(b2h(eye), 16)
            let rib = merk(feet)
            need(bleq(rib, ribs[eyenum]), `tack feet do not merk to specified rib`)
            need(bleq(merk(ribs), root), 'bad rib merkelization')
        }
        return pass(undefined)
    } catch (e) {
        return fail(e.message)
    }
}

// context is previous tock
// returns *marginal* work, the number you sum to get cumulative work
function vinx_tock(prev :Tock, tock :Tock) :Okay<Work> {
    try {
        aver(_ => {
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
    } catch (e) {
        return fail(e.message)
    }
}
