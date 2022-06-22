import { test } from 'tapzero'

import {
    h2b, isblob, bleq
} from '../core/word.js'
import { Rock } from '../core/rock.js'

test('rock', t=>{
    let rock = new Rock('')
    let empty
    rock.rite(r=> {
        empty = r.read(h2b('ff'))
    })
    t.ok(empty, 'must be emptyblob initialized')
    t.ok(isblob(empty), 'must be emptyblob initialized')
    t.equal(0, empty.length, 'must be emptyblob initialized')

    rock.rite(r => {
        r.etch(h2b('ff'), h2b('ee'))
    })
    let out
    rock.rite(r=> {
        out = r.read(h2b('ff'))
    })
    t.deepEqual(out, h2b('ee'))

    // can etch same value
    rock.rite(r => r.etch(h2b('ff'), h2b('ee')))
    rock.rite(r => {
        out = r.read(h2b('ff'))
    })
    t.deepEqual(out, h2b('ee'))

    // can't modify it
    t.throws(()=>{
        rock.rite(r => {
            r.etch(h2b('ff'), h2b('00'))
        })
    }, 'must not modify same key with new value')

})

test('rock find_min', t=> {
    let rock = new Rock('')
    rock.rite(r => {
        r.etch(h2b('aa00'), h2b('0000'))
        r.etch(h2b('aa11'), h2b('0001'))
        r.etch(h2b('bb00'), h2b('0002'))
        r.etch(h2b('bb11'), h2b('0003'))
    })
    let min
    rock.rite(r => { // reed
        min = r.find_min(h2b('bb'))
    })
    t.deepEqual(min, [h2b('bb00'), h2b('0002')])
})

import { LmdbRock } from '../core/lmdbrock.js'

test('lmdb', t=>{
    let rock = new LmdbRock('test/db')
    rock.rite(r=>{
        r.etch(h2b('ff'), h2b('00'))
    })
})
