import { test } from 'tapzero'

import {
    roll, h2b,
    sign, scry,
    Tick,
    addr, t2b
} from '../core/word.js'
import {
    form_tick
} from '../core/well.js'

import {
    _checksig,
    vinx_tick,
} from '../core/vinx.js'
import elliptic from 'elliptic'
const ec = new elliptic.ec('secp256k1')

test('checksig', t=>{ try {
    const keypair = ec.genKeyPair()
    const seck = keypair.getPrivate().toBuffer()
    const pubk = Buffer.from(keypair.getPublic().encodeCompressed())
    const code = addr(pubk) // in prev tick

    let tick = [[
        ['aa'.repeat(24), '00', 'cc'.repeat(65)].map(h2b)
    ],[
        [code, '0000ffffffffff',].map(h2b)
    ]] as Tick
    form_tick(tick)
    const move = tick[0][0]
    const ments = tick[1]
    const mask = roll([
        t2b("minicash movement"),
        [ [ move[0], move[1], t2b('') ] ],
        ments
    ])

    let sig = sign(mask, seck)

    tick[0][0][2] = sig

    form_tick(tick)
    let ok = _checksig(tick, 0, code)
    t.ok(ok, 'checksig must succeed')
} catch (e) { t.ok(false, e.reason) }})

