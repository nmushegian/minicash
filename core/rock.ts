// content-addressed data and other deterministic insert-only data

import {
    Okay, okay, pass, fail, toss, aver,
    Blob, Roll, bleq, isblob, islist, roll, unroll,
    Tick, Tack, Tock, Mash, mash, b2h, h2b
} from './word.js'

export {
    Rock
}

// rock view: pure hash DB    hash(val)   -> val
// slab view: insert-only     key  -> val
// tree view: pure map        snap -> key -> val

// rock:
//   ['tick', tickhash]    -> tick
//   ['tock', tockhash]    -> tock

// slab/thin
//   ['work', tockhash]                  -> work // cumulative work
//   ['next', tockhash, work, tockhash]  -> ()   // next tock by work
// slab/part
//   ['tack', tockhash,i]    -> tack // set of 1024 ticks
//   ['fold', tockhash,i]    -> fold // [snap, cash, cash]
// slab/full
//   ['know', tockhash]      -> know // validity state

// tree/thin
//   ['hist', snap] -> (tockhash -> ())          // fast common ancestor
// tree/part
//   ['tree', snap] -> (mark     -> leaf) // utxo set

class Rock {
    _db

    constructor(path:string) {
        this._db = new Map()
    }

    // emptyblob-initialized
    _get(key :Blob) :Blob {
        let skey = key.toString('binary')
        let val = this._db.get(skey)
        if (val) return val
        else return h2b('')
    }

    _set(key :Blob, val :Blob) :Blob {
        let skey = key.toString('binary')
        this._db.set(skey, val)
        return val
    }

    // insert-only
    etch(k :Blob, v :Blob) {
        let pv = this.read(k)
        if (pv.length > 0 && !bleq(v, pv)) {
            toss(`panic: etch key with new value`)
        }
        this._set(k, v)
    }

    read(k :Blob) :Blob {
        return this._get(k)
    }

}
