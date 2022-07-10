import { test } from 'tapzero'

import {
    roll,
    okay,
    h2b, t2b, bleq,
    Snap
} from '../core/word.js'

import { Rock, rkey } from '../core/rock.js'

import { Tree } from '../core/radx.js'

test.only('tree', t=>{
    let rock = new Rock('test/db', true)
    let tree = new Tree(rock)

    // initialized with dummy entry "" -> "", next snap is 1
    let zero = h2b('00'.repeat(8))
    let init = rock.read_one(zero)
    t.deepEqual(init, roll([h2b('00'), h2b('00'), h2b(''), h2b('00')]))
    let next = rock.read_one(t2b('aloc'))
    let one = h2b('00'.repeat(7) + '01')
    t.deepEqual(next, one)

    tree.grow(zero, (rock, twig, snap) => {
        t.deepEqual(snap, one)
        let key1 = h2b('000000000000000001')
        twig.etch(key1, h2b('aa'))
        let aa = twig.read(key1)
        t.deepEqual(aa, h2b('aa'))
    })

})


