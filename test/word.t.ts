import { test } from 'tapzero'

import {
    merk, mash,
    h2b, bleq,
} from '../core/word.js'

test('merk', t=>{
    t.throws(()=>{ merk([]) }, `merk not defined on empty list`)

    let vals = [h2b('ff'), h2b('00')]
    let root = merk(vals)
    t.ok(root)
    t.equal(root.length, 24)

    let solo = [h2b('ff')]
    let diff = merk(solo)
    t.notEqual(solo[0], diff, `merk must not be no-op for len 1 list`)
})
