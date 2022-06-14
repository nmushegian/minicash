// content-addressed data (later, parallel read and write)

import {
    Okay, okay, pass, fail, toss,
    Blob, Roll, blob, roll, unroll,
    Tick, Tock, Mash, mash, b2h, h2b
} from './word.js'

export {
    Rock
}

class Rock {
    // tmp: hexs -> hexs
    _db

    constructor(path:string) {
        this._db = {}
    }

    repr() :Roll {
        return [] // sorted kv pairs for inspection
    }

    // emptyblob-initialized
    _get(key :Blob) :Blob {
        let hkey = b2h(key)
        let hval = this._db[hkey]
        if (hval) return h2b(hval)
        else return blob('')
    }

    // insert-only
    _set(key :Blob, val :Blob) {
        let hkey = b2h(key)
        let hval = b2h(val)
        let pval = this._db[hkey]
        if (!pval) {
            this._db[hkey] = hval
        } else {
            if (pval !== hval) {
                toss(`panic, modifying insert-only value`)
            }
        }
    }

    etch_tick(tick :Tick) :Mash {
        let val = roll(tick)
        let key = mash(val)
        this._set(key, val)
        return key
    }
    read_tick(tish :Mash) :Okay<Tick> {
        let val = this._get(tish)
        if (val.length) return pass(unroll(val))
        else return fail(`no such tick`)
    }

    etch_tock(tock :Tock) :Mash {
        let val = roll(tock)
        let key = mash(val)
        this._set(key, val)
        return key
    }
    read_tock(tosh :Mash) :Okay<Tock> {
        let val = this._get(tosh)
        if (val.length) return pass(unroll(val))
        else return fail(`no such tock in rock: ${tosh}`)
    }

    /*
    // [tockhash,idx] -> tickhash
    tack_etch(tack :Tack, indx :number) :Mash
    tack_read(tosh :Mash, indx :number) :Mash

    */
}
