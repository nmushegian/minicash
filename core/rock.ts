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

class Rite {
    _dbtx
    _done
    constructor(dbtx) {
        this._dbtx = dbtx
        this._done = false
    }
    etch(key :Blob, val :Blob) {
        aver(_=> {
            let pval = this.read(key)
            if (pval.length > 0 && !bleq(val, pval)) {
                toss(`panic: etch key with new value`)
            }
            return true
        }, `etch preconditions`)
        let skey = key.toString('binary')
        this._dbtx.set(skey, val)
        return val
    }
    read(key :Blob) {
        let skey = key.toString('binary')
        let val = this._dbtx.get(skey)
        if (val) return val
        else return h2b('')
    }
    _seal() {}
    _bail() {}
}

class Rock {
    _db

    constructor(path:string) {
        this._db = new Map()
    }

    etch_one(key :Blob, val :Blob) {
        this.rite(r => r.etch(key, val))
    }

    read_one(key :Blob) :Blob {
        let out
        this.rite(r => { out = r.read(key) })
        return out
    }

    rite(f :((r:Rite) => void)) {
        let rite = new Rite(this._db)
        try {
            f(rite)
            rite._seal()
        } catch (e) {
            toss(`panic rite throw`)
            rite._bail()
        }
    }
}
