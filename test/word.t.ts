import { test } from 'tapzero'

import {
    merk, mash,
    h2b, bleq,
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
