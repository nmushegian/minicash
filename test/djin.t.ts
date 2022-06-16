import { test } from 'tapzero'

import { Djin } from '../core/djin.js'

import {
    okay,
    roll, h2b,
    mash,
    memo,
} from '../core/word.js'


test('djin', t=>{
    let djin = new Djin('')
    let bang = djin.bang()
    let out
    out = okay(djin.read(memo('ask/tocks', [mash(roll(bang))])))
    t.deepEqual(out, memo('say/tocks', [bang]))

    // make next tock
    let tock1 = [
        mash(roll(bang)),
        h2b('00'.repeat(24)),
        h2b('00'.repeat(7)), // todo time
        h2b('ff'.repeat(7))
    ]
    out = okay(djin.turn(memo('say/tocks', [tock1])))
    // apply to djin
})
