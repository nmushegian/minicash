import { test } from 'tapzero'

import {
    okay,
    h2b, bleq,
    Snap
} from '../core/word.js'

import { Rock } from '../core/rock.js'
import { Tree } from '../core/tree.js'

test('leaf keys', t=>{
    let rock = new Rock('')
    let tree = new Tree(rock)
    let snap = tree.grow_twig(h2b(''), twig => {
        twig.set(h2b('ff'), h2b('ff'))
    })
    console.log('returned snap', snap)
    let next = okay(snap)
    console.log('next', next)
    let val = okay(tree.read_twig(next, h2b('ff')))
    console.log(val)
    t.ok(bleq(val, h2b('ff')), `must return same key as was set`)
})

