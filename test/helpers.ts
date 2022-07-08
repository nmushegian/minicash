import {form_tick} from "../core/well.js";
import {addr, mash, roll, sign, t2b, okay, h2b, extend, n2b, Tick, b2h, rmap} from "../core/word.js";
import Debug from 'debug'
const debugkey = Debug('dbg::key')
const debugtxin = Debug('dbg::txin')
import elliptic from 'elliptic'
const ec = elliptic.ec('secp256k1')


const keys = {
    ali: 'e4c90c881b372adf66e8f566de63f560f48ef16a31c2aef9b860023ff9ab634f',
    bob: '9f092b266aec975d0d75fb1046ab8986262659fb88521a22500a92498780dce0',
    cat: '1d4d8c560879214483c8645fe4b60d0fb72033c0591716c7af2df787823cf3b7',
}

// prevtockhash needs to be banghash
export const maketicks = (prevtockhash, amt, n) :Tick[] => {
    if (0 == n) return []
    let seck = Buffer.from(keys.ali, 'hex')
    let keypair = ec.keyFromPrivate(seck)
    let pubkey = Buffer.from(keypair.getPublic().encodeCompressed())
    let code = addr(pubkey)

    let tick = [
        [[prevtockhash, h2b('07'), h2b('00'.repeat(65))]],
        [[code, extend(n2b(amt), 7)]]
    ] as Tick
    let txin = mash(roll(tick))
    let ticks = [tick]
    for (let i = 0; i < n - 1; i++) {
        let tick = [
            [[txin, h2b('00'), h2b('00'.repeat(65))]],
            [[code, extend(n2b(amt), 7)]]
        ]
        const mask = roll([
            t2b("minicash movement"),
            [[txin, h2b('00'), t2b('')]],
            tick[1]
        ])
        const sig = sign(mask, seck)
        tick[0][0][2] = sig
        okay(form_tick(tick))
        ticks.push(tick as Tick)
        txin = mash(roll(tick))
    }

    return ticks
}

export const dbgtick = (tick) => {
    debugkey(tick)
    try {
        okay(form_tick(tick))
    } catch (err) {
        debugkey('not well formed (', err, ')')
        return
    }
    const moves = tick[0]
    const ments = tick[1]
    debugtxin(`txin (mash): ${mash(roll(tick)).toString('hex')}`)
    moves.forEach((move, moveidx) => {
        debugkey(`move#${moveidx}`)
        Object.entries(keys).forEach(entry => {
            const name = entry[0]
            const privkey = entry[1]
            const seck = Buffer.from(entry[1], 'hex')
            const mask = roll([
                t2b("minicash movement"),
                [[move[0], move[1], t2b('')]],
                ments
            ])
            const sig = sign(mask, seck)
            const keypair = ec.keyFromPrivate(seck)
            const pubkey = Buffer.from(keypair.getPublic().encodeCompressed())
            debugkey(
                '  ', name,
                `code:${addr(pubkey).toString('hex')}`,
                `sign:${sig.toString('hex')}`
            )
        })
    })
}