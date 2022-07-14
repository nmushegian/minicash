import { rmSync, mkdirSync } from 'fs'
import { default as lmdb } from 'node-lmdb'
import { default as process } from 'node:process'

import {
    aver, need, toss, err,
    Blob, isblob, bleq, bcat, extend,
    roll,
    b2t, t2b, h2b, n2b,
    Mash, mash,
    Work, Time, Cash, Know, Snap, Fees,
    Tock,
} from './word.js'

export {
    Rock, Rite, rkey
}

type RKey = Blob

function rkey(s :string, ...args :Blob[]) :RKey {
    return Buffer.concat([t2b(s), ...args])
}

class Rite {
    dbi
    dbtx
    constructor(dbi, dbtx) {
        this.dbi = dbi
        this.dbtx = dbtx
    }

    etch_best(tockhash :Mash) {
        this.etch(rkey('best'),  tockhash)
    }
    etch_tock(tock :Tock) {
        let tockroll = roll(tock)
        this.etch(rkey('tock', mash(tockroll)),  tockroll)
    }
    etch_work(tockhash :Mash, totalwork :Work) {
        this.etch(rkey('work', tockhash),  n2b(totalwork))
    }
    etch_left(time :bigint, left :bigint) {
        // extend time to 7 bytes so we can just use the `time` field from tock to get it
        this.etch(rkey('left', extend(n2b(time), 7)),  n2b(left))
    }
    etch_know(tockhash :Mash, know :Know) {
        this.etch(rkey('know', tockhash),  t2b(know))
    }
    etch_fold(tockhash :Mash, foldidx :number, snap :Snap, fees :Fees) {
        this.etch(rkey('fold', tockhash, n2b(BigInt(foldidx))),
                  roll([snap, n2b(fees)]))
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

    find_max(prefix :Blob, keylen :number) :[Blob, Blob] {
        // last possible key with given prefix
        let last = bcat(prefix, h2b('ff'.repeat(keylen - prefix.length)))
        let cursor = new lmdb.Cursor(this.dbtx, this.dbi, {keyIsBuffer:true})
        // see note in find_min about this type cast
        cursor.goToRange(last as unknown as string)
        let pair
        cursor.getCurrentBinary((dbkey, dbval) => {
            pair = [dbkey, dbval]
        })
        // LMDB only provides `goToRange`, which finds the minimum key greater than argument.
        // We can use this to get the last value in constant time by overshooting and
        // stepping back one key.

        // It could be that the last possible valid key (suffix ...ffff) is actually present,
        // but more likely goToRange overshoots by 1. It could also return empty,
        // in which case we check goToLast.
        if (pair) {
            // if `pair` is defined, we might have hit the exact key (suffix ...ffff)
            // but more likely we overshot by 1
            let dbprefix = pair[0].slice(0, prefix.length)
            if (bleq(dbprefix, prefix)) {
                cursor.close()
                return pair
            } else {
                cursor.goToPrev()
                cursor.getCurrentBinary((dbkey, dbval) => {
                    pair = [dbkey, dbval]
                })
                cursor.close()
                let dbprefix = pair[0].slice(0, prefix.length)
                if (bleq(dbprefix, prefix)) {
                    return pair
                } else {
                    return [h2b(''), h2b('')]
                }
            }
        } else {
            // if `pair` is undefined, then we overshot the whole db, in this
            // case the only possibility is that it is the very last key
            cursor.goToLast()
            cursor.getCurrentBinary((dbkey, dbval) => {
                pair = [dbkey, dbval]
            })
            cursor.close()
            let dbprefix = pair[0].slice(0, prefix.length)
            if (bleq(dbprefix, prefix)) {
                return pair
            } else {
                return [h2b(''), h2b('')]
            }
        }

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
