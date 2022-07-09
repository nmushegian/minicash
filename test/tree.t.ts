import { test } from 'tapzero'

import {
    okay,
    h2b, t2b, bleq,
    Snap
} from '../core/word.js'

import { Rock } from '../core/rock.js'
import { Tree } from '../core/tree.js'

test.only('tree', t=>{
    let rock = new Rock('test/db', true)
})

test('leaf keys', t=>{
    let rock = new Rock('test/db', true)
    let tree = new Tree(rock)
    let next
    tree.grow(h2b(''), (rock,twig,next_) => {
        twig.etch(h2b('ff'), h2b('ff'))
        next = next_
    })
    let val
    tree.look(next, (rock,twig) => {
        val = twig.read(h2b('ff'))
    })
    t.ok(bleq(val, h2b('ff')), `must return same key as was set`)
    rock.shut()
})

