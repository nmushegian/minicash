import { test } from 'tapzero'

//import { tick } from '../core/cash.js'
import { Djin } from '../core/djin.js'


import {
    Tick,
    okay,
    roll, h2b,
    mash, memo, merk,
} from '../core/word.js'


test('djin', t=>{ try {
    let djin = new Djin('')
    let out
    out = okay(djin.read(memo('ask/tocks', [h2b('00'.repeat(24))])))
    t.deepEqual(out, memo('say/tocks', [djin.tree.bang]))

    let tick1 = [[
        [] // no moves
    ],[
        [h2b('00'.repeat(20)), h2b('00'.repeat(7))] // 1 ment with miner reward
    ]]

    let tack1 = [
        [], // head
        [], // eyes
        [merk([mash(roll(tick1 as Tick))])],
        [tick1],
    ]

    let tock1 = [
        h2b('00'.repeat(24)),
        merk([mash(roll(tick1 as Tick))]),
        h2b('00'.repeat(6) + '39'), // 57 in hex
        h2b('ff'.repeat(7))
    ]

    tack1[0] = tock1

    // give to djin
    out = okay(djin.turn(memo('say/tocks', [tock1])))
    // djin asks for tack

    t.deepEqual(out, memo('ask/tocks', mash(roll(tock1))))
} catch(e) { console.log(e); t.ok(false, e.message); }})
