import { default as lmdb } from 'node-lmdb'
import { default as process } from 'node:process'

import {
    Blob, aver, isblob,
    need, toss, err
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
        aver(_=>isblob(val), `rite.etch val not a blob: ${val}`)
        this.dbtx.putBinary(this.dbi, key, val)
    }
    read(key :Blob) :Blob {
        aver(_=>isblob(key), `rite.read key not a blob: ${key}`)
        return this.dbtx.getBinary(this.dbi, key)
    }
}

class Rock {
    env
    dbi
    constructor(path) {
        this.env = new lmdb.Env()
        this.env.open({ path })
        this.dbi = this.env.openDbi({
            name: "testdb",
            keyIsBuffer: true,
            create: true
        })
        process.on('exit', exitcode => { // todo test...
            this.dbi.close()
            this.env.close()
        })
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
