// content-addressed data and other deterministic insert-only data

import {
    Okay, okay, pass, fail, toss, aver,
    Blob, Roll, bleq, isblob, islist, roll, unroll,
    Tick, Tack, Tock, Mash, mash, b2h, h2b
} from './word.js'

export {
    Rock
}

// core data

// ['tick', tickhash]    -> tick
// ['tock', tockhash]    -> tock
// ['tack', tockhash, i] -> tack

// ['thin', tockhash]    -> stat
// ['full', tockhash]    -> snap

// pure kvdb implemented by Tree
// ['tree', snap] -> (bill -> leaf)

// not necessary, but useful tree reverse indices:

// next fork tree for smarter sync loop, sorted set by work
//    ['next', tockhash, work, tockhash]  ->  bool
// per-branch tock set for fast common ancestor
//    ['hist', snap] -> (tockhash -> bool) // pure map

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
