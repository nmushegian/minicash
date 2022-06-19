import { test } from 'tapzero'

import {
    okay,
    h2b, t2b, bleq,
    Snap
} from '../core/word.js'

import { Rock } from '../core/rock.js'
import { Tree } from '../core/tree.js'

test('leaf keys', t=>{
    let rock = new Rock('')
    let tree = new Tree(rock)
    let next = t2b('next')
    tree.grow(h2b(''), next, twig => {
        twig.set(h2b('ff'), h2b('ff'))
    })
    let val
    tree.look(next, twig => {
        val = twig.get(h2b('ff'))
    })
    t.ok(bleq(val, h2b('ff')), `must return same key as was set`)
})

