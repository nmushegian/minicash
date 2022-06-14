// content-addressed data (later, parallel read and write)

import {
    Okay, okay, pass, fail, toss, aver,
    Blob, Roll, isblob, islist, roll, unroll,
    Tick, Tack, Tock, Mash, mash, b2h, h2b
} from './word.js'

export {
    Rock
}

class Rock {
    _db

    constructor(path:string) {
        this._db = new Map()
    }

    repr() :Roll {
        toss(`todo`)
        return [] // sorted kv pairs for inspection
    }

    // emptyblob-initialized
    _get(key :Blob) :Blob {
        let skey = key.toString('binary')
        let val = this._db.get(skey)
        if (val) return val
        else return h2b('')
    }

    // insert-only
    _set(key :Blob, val :Blob) {
        let skey = key.toString('binary')
        let pval = this._db.get(skey)
        if (!pval) {
            this._db.set(skey, val)
        } else {
            if (!val.equals(pval)) {
                toss(`panic, modifying insert-only value`)
            } else {} // no-op, same value
        }
        return val
    }

    // assumes a flat roll of blobs with fixed sizes
    etch(rk :Roll, rv :Roll) :Roll {
        aver(_=>islist(rk), `etch rollkey must be a list`)
        aver(_=>rk.every(isblob), `etch rollkey must be flat list`)
        let v = roll(rv)
        let k = roll(rk)
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
