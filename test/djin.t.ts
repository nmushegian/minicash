import { test } from 'tapzero'

import { Djin } from '../core/djin.js'

import {
    okay,
    roll,
    mash,
    memo,
} from '../core/word.js'


test('djin', t=>{
    let djin = new Djin('')
    let bang = djin.bang()
    let out
    out = okay(djin.read(memo('ask/tocks', [mash(roll(bang))])))
    console.log(out.toString())
    t.deepEqual(out, memo('say/tocks', [bang]))
})
