// content-addressed data and other deterministic insert-only data

import {
    Okay, okay, pass, fail, toss, aver,
    Blob, bleq, h2b
} from './word.js'

export {
    Rock
}




//  ['tick', tickhash]         -> tick
//  ['tack', tockhash,i]       -> tack // set of 1024 ticks
//  ['tock', tockhash]         -> tock

//  ['work', tockhash]         -> work // cumulative work
//  ['fold', tockhash,i]       -> fold // [snap, cash]  partial utxo / fees
//  ['know', tockhash]         -> know // validity state

//  [(snap) 'ment', mark       -> ment // utxo put [code, cash]
//  [(snap) 'pent', mark       -> pent // utxo use [tish, tosh] (spent by tick, in tock)
//  [(snap) 'pyre', mark       -> time // utxo expires

//  ['best']                   -> tock

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
        console.log('read')
        aver(_=> key != undefined, `read key must be defined`)
        aver(_=> key.length > 0, `read key must not be empty`)
        let skey = key.toString('binary')
        let val = this._dbtx.get(skey)
        if (val) {
            console.log('reading val', val)
            return val
        }
        else {
            console.log('default val')
            return h2b('')
        }
    }
    // lmdb.cursor.goToRange(key)
    // get the first key with a given prefix
    scan(key :Blob) :Blob {
        throw new Error('todo rock_scan')
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
        console.log('read_one')
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
