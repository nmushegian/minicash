import { rmSync, mkdirSync } from 'fs'
import { default as lmdb } from 'node-lmdb'
import { default as process } from 'node:process'

import {
    aver, need, toss, err,
    Blob, isblob, bleq, bcat,
    b2t, h2b,
} from './word.js'

export {
    Rock, Rite
}

class Rite {
    dbi
    dbtx
    constructor(dbi, dbtx) {
        this.dbi = dbi
        this.dbtx = dbtx
    }
    etch(key :Blob, val :Blob) {
        aver(_=>isblob(key), `rite.etch key not a blob: ${key}`)
        aver(_=>isblob(val), `rite.etch val not a blob: ${val} (key was ${key})`)
        aver(_=> {
            if (key.toString().startsWith('best')) {
                return true
            }
            let prev = this.dbtx.getBinary(this.dbi, key)
            if (prev && prev.length > 0 && !bleq(prev, val)) {
                return false
            }
            return true // todo usage
        }, `etch must not set a new value for existing key`)
        this.dbtx.putBinary(this.dbi, key, val)
    }
    read(key :Blob) :Blob {
        aver(_=>isblob(key), `rite.read key not a blob: ${key}`)
        let val = this.dbtx.getBinary(this.dbi, key)
        if (val) return val
        else return Buffer.from('')
    }
    // WARNING, this makes a hard assumption that the keys with the given
    // prefix all have the same length
    find_min(prefix :Blob, keylen :number) :[Blob, Blob] {
        // first possible key with given prefix
        let first = bcat(prefix, h2b('00'.repeat(keylen - prefix.length)))
        let cursor = new lmdb.Cursor(this.dbtx, this.dbi, {keyIsBuffer:true})
        // this is a typescript binding issue, it thinks goToRange must take
        // a string, but we gave cursor `keyIsBuffer: true`, so
        // it actually takes a buffer. node-lmdb does the right thing here.
        cursor.goToRange(first as unknown as string)
        let pair
        cursor.getCurrentBinary((dbkey, dbval) => {
            pair = [dbkey, dbval]
        })
        cursor.close()
        if (pair) {
            let dbprefix = pair[0].slice(0, prefix.length)
            if (bleq(dbprefix, prefix)) {
                return pair
            }
        }
        return [h2b(''), h2b('')]
    }
    find_max(key :Blob) :Blob {
        toss(`todo rock.find_max`)
        return Buffer.from('')
    }
}

class Rock {
    env
    dbi
    constructor(path, reset=false) {
        this.env = new lmdb.Env()
        if (reset) {
            rmSync(path, {force:true, recursive:true})
            mkdirSync(path)
        }
        console.log('opening', path)
        this.env.open({ path })
        this.dbi = this.env.openDbi({
            name: "testdb",
            keyIsBuffer: true,
            create: true
        })
//        process.on('exit', exitcode => { // todo test...
//            this.shut()
//        })
    }
    shut() {
        this.dbi.close()
        this.env.close()
    }

    read_one(key :Blob) :Blob {
        let val
        this.rite(rite => {
            val = rite.read(key)
        })
        return val
    }

    etch_one(key :Blob, val :Blob) {
        this.rite(rite => { rite.etch(key, val) })
    }

    rite(f:((Rite)=>void)) {
        let dbtx = this.env.beginTxn()
        let rite = new Rite(this.dbi, dbtx)
        try {
            f(rite)
            //rite._seal()   todo check how nice lmdb plays with bad dbtx reuse
            dbtx.commit()
        } catch (e) {
            //rite._seal()
            dbtx.abort()
            throw e
        }
    }
}
