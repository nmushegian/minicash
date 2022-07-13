import { test } from 'tapzero'

import {
    h2b, isblob, bleq
} from '../core/word.js'
import { Rock } from '../core/rock.js'

test('rock', t=>{ try {
    let rock = new Rock('test/db', true)
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


    // reset
    rock.shut()
    rock = new Rock('test/db', true)
    rock.rite(r => {
        r.etch(h2b('aa00'), h2b('0000'))
        r.etch(h2b('aa11'), h2b('0001'))
        r.etch(h2b('bb00'), h2b('0002'))
        r.etch(h2b('bb11'), h2b('0003'))
        r.etch(h2b('ccaa'), h2b('0004'))
        r.etch(h2b('ccbb'), h2b('0005'))
        r.etch(h2b('dd'), h2b('0006'))
        r.etch(h2b('dd00'), h2b('0007'))
        r.etch(h2b('dd11'), h2b('0008'))
    })

    // find_min
    rock.rite(r => {
        let [key,val] = r.find_min(h2b('bb'), 2)
        t.deepEqual(val, h2b('0002'))

        let [key2, val2] = r.find_min(h2b('cc'), 2)
        t.deepEqual(val2, h2b('0004'))

        let [key3, val3] = r.find_min(h2b('ff'), 2)
        t.deepEqual(val3, h2b('')) // emptyblob initialized

        let [k4, v4] = r.find_min(h2b('ccbb'), 2)
        t.deepEqual(v4, h2b('0005'))

        let [k5, v5] = r.find_min(h2b('aa00'), 2)
        t.deepEqual(v5, h2b('0000'))

        let [k6, v6] = r.find_min(h2b('dd'), 2)
        t.deepEqual(v6, h2b('0007'))

    })

    // find_max
    rock.rite(r => {
        let [k1, v1] = r.find_max(h2b('cc'), 2)
        t.deepEqual(v1, h2b('0005'))

        let [k2, v2] = r.find_max(h2b('dd'), 2)
        t.deepEqual(v2, h2b('0008'))

        let [k3, v3] = r.find_max(h2b('dd11'), 2)
        t.deepEqual(v3, h2b('0008'))

        let [k4, v4] = r.find_max(h2b('aa'), 2)
        t.deepEqual(v4, h2b('0001'))

        let [k5, v5] = r.find_max(h2b('aa00'), 2)
        t.deepEqual(v5, h2b('0000'))
    })

    rock.shut()
} catch (e) { t.ifError(e, 'rock test throw') } } )

