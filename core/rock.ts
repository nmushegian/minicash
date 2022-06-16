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

// slab:
//   ['work', tockhash]      -> work // cumulative work
//   ['tack', tockhash,i]    -> tack // set of 1024 ticks
//   ['fees', tockhash,i]    -> fees // total per tack
//   ['snap', tockhash,i]    -> snap // utxo set snaps
//   ['know', tockhash]      -> know // validity state

// tree:
//   ['tree', snap] -> (mark -> leaf) // utxo set

// not necessary, but useful tree reverse indices:
// (slab):
// next fork tree for smarter sync loop, sorted set by work
//    ['next', tockhash, work, tockhash]  ->  bool
// per-branch tock set for fast common ancestor
//    ['hist', snap] -> (tockhash -> bool) // pure set
// can also be used for tracking ticks in this branch
//    ['hist', snap] -> (tickhash -> bool) // pure set
// you can also check ticks-in-branch by checking an input spent state

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
