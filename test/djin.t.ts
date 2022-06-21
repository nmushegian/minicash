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
    out = okay(djin.turn(memo('ask/tocks', mash(roll(djin.bang)))))
    t.deepEqual(out, memo('say/tocks', [djin.bang]))

    let tick1 = [[
        [] // no moves
    ],[
        [h2b('00'.repeat(20)), h2b('00'.repeat(7))] // 1 ment with miner reward
    ]]

    let tack1 = [
        undefined, // head
        [], // eyes
        [merk([mash(roll(tick1 as Tick))])],
        [tick1],
    ]

    let tock1 = [
        mash(roll(djin.bang)),
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
