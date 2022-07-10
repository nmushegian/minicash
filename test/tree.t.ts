import { test } from 'tapzero'

import {
    roll,
    okay,
    h2b, t2b, bleq,
    Snap
} from '../core/word.js'

import { Rock } from '../core/rock.js'

import { Tree } from '../core/radx.js'

test.only('tree', t=>{
    let rock = new Rock('test/db', true)
    let tree = new Tree(rock)

    // initialized with dummy entry 0 -> 0, next snap is 1
    let init = rock.read_one(h2b('00'.repeat(8)))
    t.deepEqual(init, roll([h2b('00'), h2b(''), h2b('')]))
    let next = rock.read_one(t2b('aloc'))
    t.deepEqual(next, h2b('00'.repeat(7) + '01'))

    
})


