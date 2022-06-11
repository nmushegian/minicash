// content-addressed data, parallel read and write

import {
    Okay, pass, fail, toss,
    Blob, Roll, blob, roll, unroll,
    Tick, Mesh, mesh,
} from './type.js'

export {
    Rock
}

class Rock {
    _db = {}

    load(path:string) {}
    save(path:string) {}

    repr() :Roll {
        return [] // sorted kv pairs for inspection
    }

    // emptyblob-initialized
    _get(key :Blob) :Blob {
        let hkey = key.toString('hex')
        let hval = this._db[hkey]
        if (hval) return blob(hval)
        else return blob('')
    }

    // insert-only
    _set(key :Blob, val :Blob) {
        let hkey = key.toString('hex')
        let hval = val.toString('hex')
        let pval = this._db[hkey]
        if (pval != hval) {
            toss(`panic: changing value of insert-only data`)
        } else {
            this._db[hkey] = hval
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
        if (val.length)
            return pass(unroll(val))
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
