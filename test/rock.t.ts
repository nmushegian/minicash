import { test } from 'tapzero'

import {
    h2b, isblob
} from '../core/word.js'
import { Rock } from '../core/rock.js'

test('rock', t=>{
    let rock = new Rock()
    let empty = rock._get(h2b('ff'))
    t.ok(empty, 'must be emptyblob initialized')
    t.ok(isblob(empty), 'must be emptyblob initialized')
    t.equal(0, empty.length, 'must be emptyblob initialized')

    rock._set(h2b('ff'), h2b('ee'))
    let out = rock._get(h2b('ff'))
    t.deepEqual(out, h2b('ee'))

    // can set same value
    rock._set(h2b('ff'), h2b('ee'))
    out = rock._get(h2b('ff'))
    t.deepEqual(out, h2b('ee'))

    // can't modify it
    t.throws(()=>{
        rock._set(h2b('ff'), h2b('00'))
    }, 'panic')

})
