import { test } from 'tapzero'

import {
    merk, mash,
    h2b, b2h, n2b, bnum,
    bleq,
    Blob, isblob,
} from '../core/word.js'

test('merk', t=>{
    t.throws(()=>{ merk([]) }, `merk not defined on empty list`)

    let vals = [h2b('ff'.repeat(24)), h2b('00'.repeat(24))]
    let root = merk(vals)
    t.ok(root)
    t.equal(root.length, 24)

    let solo = [h2b('ff'.repeat(24))]
    let same = merk(solo)
    t.equal(solo[0], same, `merk must be no-op for len 1 list`)
})

test('casts', t=>{
    let bn = bnum(h2b('ff00'))
    let buff = n2b(bn)
    t.ok(isblob(buff), `n2b result must be a blob`)
    console.log(bn)
    console.log(buff)
})
