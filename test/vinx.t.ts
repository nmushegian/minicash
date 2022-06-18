import { test } from 'tapzero'

import {
    roll, h2b,
    sign, scry,
    Tick,
    addr,
} from '../core/word.js'

import {
    _checksig,
    vinx_tick,
} from '../core/vinx.js'

test('checksig', t=>{ try {
    let seck = h2b('00'.repeat(32))
    let pubk = h2b('ff'.repeat(32)) // todo keypair
    let code = addr(pubk) // in prev tick

    let tick = [[
        ['aa'.repeat(24), '00', 'cc'.repeat(32)].map(h2b)
    ],[
        ['dd'.repeat(20), '0000ffffffffff'].map(h2b)
    ]] as Tick
    let mask = roll([[
        ['aa'.repeat(24), '00', ''].map(h2b)
    ],[
        ['dd'.repeat(20), '0000ffffffffff'].map(h2b)
    ]])

    let sig = sign(mask, seck)

    tick[0][0][2] = sig

    let ok = _checksig(tick, 0, code)
    t.ok(ok, 'checksig must succeed')
} catch (e) { t.ok(false, e.reason) }})

