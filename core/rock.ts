// content-addressed data and other deterministic insert-only data

import {
    Okay, okay, pass, fail, toss, aver,
    Blob, Roll, bleq, isblob, islist, roll, unroll,
    Tick, Tack, Tock, Mash, mash, b2h, h2b
} from './word.js'

export {
    Rock
}

// ['tick', tickhash]    -> tick
// ['tock', tockhash]    -> tock
// ['tack', tockhash, i] -> tack

// ['thin', tockhash]    -> stat
// ['full', tockhash]    -> snap
// ['know', tockhash]    -> PV | DV | PN | DN

// pure kvdb implemented by Tree
// ['tree', snap] -> (utxo -> [[hash,cash],burn])

// not necessary, but useful tree reverse indices
// height reverse index for sanity
//    ['time', tockhash] -> time
// spent by for stat node
//    ['used', utxo]     -> (tickhash,tockhash)[]
// next fork tree for smarter sync retry
//    ['next', tockhash] -> tockhash[]
// per-branch tock set for fast common ancestor
//    ['hist', snap]     -> tockhash -> bool

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
    // assumes a flat roll of blobs with fixed sizes
    etch(rk :Roll, rv :Roll) :Roll {
        aver(_=>islist(rk), `etch rollkey must be a list`)
        aver(_=>rk.every(isblob), `etch rollkey must be flat list`)
        let v = roll(rv)
        let k = roll(rk)
        let pv = this._db.get(k)
        if (pv && !bleq(v, pv)) {
            toss(`panic: etch key with new value`)
        }
        this._set(k, v)
        return rv
    }

    read(rk :Roll) :Roll {
        aver(_=>islist(rk), `read rollkey must be a list`)
        aver(_=>rk.every(isblob), `read rollkey must be a flat list`)
        let k = roll(rk)
        return this._get(k)
    }

}
