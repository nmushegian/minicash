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
    Tick, Tock, Tack, b2h, merk
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
function vinx_tick(conx :Tick[], tick :Tick, tock? :Tock) :Okay<Fees> {
    try {
        conx.forEach(x => form_tick(x as Roll))
        form_tick(tick)

        const moves = tick[0]
        let ticash = BigInt(0)
        moves.forEach((move, moveidx) => {
            const [txin, indx, sign] = move
            const indxnum = Number('0x'+b2h(indx))
            if (indxnum == 7) {
                const prev = txin
                aver(_ => tock != undefined, 'panic: vinx_tick - indx 7 but tock undefined')
                need(bleq(prev, mash(roll(tock))), 'bad prev tock hash')
                return
            }
            const intx = conx.find(x => mash(roll(x)).equals(txin)) // stupid
            const iments  = intx[1]
            need(indxnum < iments.length, 'indx out of bounds')
            const iment = intx[1][Number(indxnum)]
            const [icode, icash] = iment
            need(_checksig(tick, moveidx, icode), 'bad sign')
            ticash += BigInt('0x' + b2h(icash))
        })

        const ments = tick[1]
        let tocash = BigInt(0)
        ments.forEach((ment, mentidx) => {
            const cash = ment[1]
            tocash += BigInt('0x' + b2h(cash))
        })
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
function vinx_tack(tock :Tock, tack :Tack) :Okay<void> {
    try {
        let [head, eye, ribs, feet] = tack
        let [prev, root, time, fuzz] = tock

        aver(_ => bleq(roll(head), roll(tock)), 'panic: vinx_tack precondition - head tock mismatch')
        aver(_ => ribs.length <= 128, 'panic: vinx_tack precondition - len(ribs) must be <= 128')
        aver(_ => feet.length <= 2 ** 17, 'panic: vinx_tack precondition - feet.length must be <= 2^17')

        if (ribs.length == 0) {
            need(bnum(eye) == BigInt(0), `eye must be 0 if ribs empty`)
            need(feet.length < 512, `len(feet) must be <512 if ribs empty`)
            need(bleq(merk(feet), root), 'merkelization failed')
        } else { // ribs len > 0
            let nchunks = Math.ceil(feet.length / 1024)
            need(
                ribs.length >= nchunks,
                `len(ribs) must be ceil(len(feet)/1024) if ribs not empty`
            )
            for (let i = 0; i < nchunks; i++) {
                let chunk = feet.slice(i, i + 1024)
                const eyenum = Number('0x' + eye.toString('hex'))
                need(bleq(merk(chunk), ribs[i + eyenum]), 'bad merkelization')
            }
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

