import { test } from 'tapzero'

import {
    okay, blob,
    Snap
} from '../core/word.js'

import { Rock } from '../core/rock.js'
import { Tree } from '../core/tree.js'

test('leaf keys', t=>{
    let rock = new Rock('')
    let tree = new Tree(rock)
    let snap = tree.grow_page(blob(''), leaf => {
        leaf.set(blob('ff'), blob('ff'))
    })
    console.log('returned snap', snap)
    let next = okay(snap)
    console.log('next', next)
    let val = okay(tree.read_page(next, blob('ff')))
    console.log(val)
    t.ok(val.equals(blob('ff')), `must return same key as was set`)
})

