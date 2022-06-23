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
    })
    let min
    rock.rite(r => { // reed
        min = r.find_min(h2b('bb'))
    })
    t.deepEqual(min, [h2b('bb00'), h2b('0002')])

    // TODO event loop stuff
    // can't modify it
//    t.throws(()=>{
//        rock.rite(r => {
//          r.etch(h2b('ff'), h2b('00'))
//        })
//    }, 'must not modify same key with new value')
    rock.shut()
} catch (e) { t.ifError(e, 'rock test throw') } } )
