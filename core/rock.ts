// content-addressed data, parallel read and write

import {
    Okay, pass, fail, toss,
    Blob, Roll, blob, roll, unroll,
    Tick, Mesh, mesh, b2h, h2b
} from './word.js'

export {
    Rock
}

class Rock {
    // tmp: hexs -> hexs
    _db = {}

    load(path:string) {}
    save(path:string) {}

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
        if (val.length == 0) toss(`panic, cannot insert empty blob`)
        let hkey = b2h(key)
        let hval = b2h(val)
        let pval = this._db[hkey]
        if (!pval) {
            this._db[hkey] = hval
        } else {
            if (pval !== hval) toss(`panic, modifying insert-only value`)
        }
    }

    tick_add(tick :Tick) :Mesh {
        let val = roll(tick)
        let key = mesh(val)
        this._set(key, val)
        return key
    }
    tick_get(tish :Mesh) :Okay<Tick> {
        let val = this._get(tish)
        if (val.length) return pass(unroll(val))
        else return fail(`no such tick`)
    }

    /*

    // tockhash -> tock
    tock_add(tock :Tock) :Mesh
    tock_get(tosh :Mesh) :Tock

    // [tockhash,idx] -> tickhash
    tack_add(tack :Tack, indx :number) :Mesh
    tack_get(tosh :Mesh, indx :number) :Mesh

    */
}
