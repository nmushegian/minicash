// content-addressed data and other deterministic insert-only data

import {
    Okay, okay, pass, fail, toss, aver,
    Blob, bleq, h2b
} from './word.js'

export {
    Rock
}

// This level of abstraction deals with blob keys and values,
// but we can still `aver` that the keys and values have one of
// a small set of types from minicash.

//  ['tick', tickhash]         -> tick
//  ['tack', tockhash,i]       -> tack
//  ['tock', tockhash]         -> tock

//  ['work', tockhash]         -> work // cumulative work
//  ['fold', tockhash,i]       -> fold // [snap, fees]  partial utxo / fees
//  ['know', tockhash]         -> know // validity state

//  ['best']                   -> tock

//  [(snap) 'ment', mark       -> ment // utxo put [code, cash]
//  [(snap) 'pent', mark       -> pent // utxo use [tish, tosh] (by tick, in tock)
//  [(snap) 'pyre', mark       -> time // utxo expires


class Rite {
    _dbtx
    _done
    constructor(dbtx) {
        this._dbtx = dbtx
        this._done = false
    }
    etch(key :Blob, val :Blob) {
        aver(_=> key != undefined, `etch key must be defined`)
        aver(_=> key.length > 0, `etch key is empty`)
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
        aver(_=> key != undefined, `read key must be defined`)
        aver(_=> key.length > 0, `read key must not be empty`)
        let skey = key.toString('binary')
        let val = this._dbtx.get(skey)
        if (val) {
            return val
        }
        else {
            return h2b('')
        }
    }

    // get first [key,val] with prefix(key) == fix
    find_min(fix :Blob) :[Blob, Blob] {
        throw new Error('todo rock.find_min')
    }
    // get last [key,val] with prefix(key) == fix
    find_max(fix :Blob) :[Blob, Blob] {
        throw new Error('todo rock.find_max')
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
            rite._bail()
            toss(`panic rite throw ${e.message}`)
        }
    }
}
