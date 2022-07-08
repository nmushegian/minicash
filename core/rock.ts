import {rmSync, mkdirSync, readdirSync, existsSync} from 'fs'
import { default as lmdb } from 'node-lmdb'
import { default as process } from 'node:process'

import {
    Blob, aver, isblob, bleq,
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
    find_min(key :Blob) :Blob {
        toss(`todo rock.find_min`)
        return Buffer.from('')
    }
    find_max(key :Blob) :Blob {
        toss(`todo rock.find_min`)
        return Buffer.from('')
    }
}

class Rock {
    env
    dbi
    constructor(path, reset=false) {
        this.env = new lmdb.Env()
        if (reset) {
            if (existsSync(path)) {
                let files = readdirSync(path)
                files.forEach(f => {
                    // leave reconstruct file(s)
                    if (!f.endsWith('.jams')) {
                        rmSync(path + '/' + f, {force:true, recursive:true})
                    }
                })
            } else {
                mkdirSync(path)
            }
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
