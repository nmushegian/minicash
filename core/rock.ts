// content-addressed data and other deterministic insert-only data

import {
    Okay, okay, pass, fail, toss, aver,
    Blob, bleq, h2b
} from './word.js'

export {
    Rock
}


//  ['tick', tickhash]         -> tick
//  ['tock', tockhash]         -> tock
//  ['tack', tockhash,i]       -> tack // set of 1024 ticks

//  ['work', tockhash]         -> work // cumulative work
//  ['fork', prev,work,next]   -> ()   // [tockhash,work,tockhash]  next tock by work
//  ['fold', tockhash,i]       -> fold // [snap, cash, cash]  partial utxo / in / out
//  ['know', tockhash]         -> know // validity state

//  [(snap) 'hist', tockhash)  -> ()   // fast ancestor check per branch
//  [(snap) 'ment', mark       -> ment // utxo set
//  [(snap) 'pent', mark       -> pent // utxo set
//  [(snap) 'pyre', mark       -> time // expires

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
