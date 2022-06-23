import { default as lmdb } from 'node-lmdb'
import { default as process } from 'node:process'

import {
    Blob,
    need, toss, err
} from './word.js'

export {
    LmdbRock, LmdbRite
}

class LmdbRite {
    dbi
    dbtx
    constructor(dbi, dbtx) {
        this.dbi = dbi
        this.dbtx = dbtx
    }
    etch(key :Blob, val :Blob) {
        // aver not set
        this.dbtx.putBinary(this.dbi, key, val)
    }
    read(key :Blob) :Blob {
        return this.dbtx.getBinary(this.dbi, key)
    }
}

class LmdbRock {
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

    rite(f:((LmdbRite)=>void)) {
        let dbtx = this.env.beginTxn()
        let rite = new LmdbRite(this.dbi, dbtx)
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
