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

    // initialized with dummy entry "00"x25 -> "00", next snap is 1
    let zero = h2b('00'.repeat(8))
    let init = rock.read_one(zero)
    t.deepEqual(init, roll([h2b('00'), h2b('00'.repeat(25)), h2b('00')]))
    let next = rock.read_one(t2b('aloc'))
    let one = h2b('00'.repeat(7) + '01')
    t.deepEqual(next, one)

    let key1 = h2b('01'.repeat(25))
    let inner // to check the snap given in grow function equals returned snap
    let snap1 = tree.grow(zero, (rock, twig, snap) => {
        t.deepEqual(snap, one)
        twig.etch(key1, h2b('aa'))
        let aa = twig.read(key1) // check value is cached
        t.deepEqual(aa, h2b('aa'))

        inner = snap
    })
    t.deepEqual(inner, snap1)
    console.log('snap1', snap1)

    tree.look(snap1, (rock, twig) => {
        let val1 = twig.read(key1)
        t.deepEqual(val1, h2b('aa'))
    })

    console.log('========')
    let key2 = h2b('0101' + '00'.repeat(23))
    let snap2 = tree.grow(snap1, (rock, twig, snap) => {
        // same first 2 bytes as prior entry, then different
        twig.etch(key2, h2b('bb'))
        let bb = twig.read(key2)
        t.deepEqual(bb, h2b('bb'))

        let aa = twig.read(key1)
        t.deepEqual(aa, h2b('aa'))
    })
})
