import { test } from 'tapzero'

import { Djin } from '../core/djin.js'

import {
    roll,
    mash,
    memo,
} from '../core/word.js'


test('djin', t=>{
    let djin = new Djin('')
    let tockzero = []
    let tockzerohash = mash(roll(tockzero))
    let out

    out = djin.read(memo('ask/tocks', [tockzerohash]))
    t.deepEqual(out, memo('say/tocks', [tockzero]))
})
