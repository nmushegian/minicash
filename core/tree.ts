// pure kvdb (later, parallel read / non-blocking write (mutable handles))

import * as immu from 'immutable'

import {
    Okay, pass, fail,
    Roll, Blob, roll, unroll, b2h, h2b, t2b, n2b,
    Snap, Tock,
} from './word.js'

import {
    Rock
} from './rock.js'

export {
    Tree, Twig, rkey
}

// This level of abstraction deals with the user's view of
// both a direct map (`rock.rite(=>)`) and a pure map (`tree.grow(=>)`)
// It provides typed interfaces for all of these records,
// and translates them into blob keys/values to put in Rock. In the case
// of the pure map (accessed via `twig`), it does some internal logic
// to translate a single read/write into log(k) read/writes of the
// pure map internal structure.

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


// A twig is a database transaction over Tree, similar to how
// rite is a database transaction over Rock. In both cases, they
// are distinct concepts from a minicash transaction, called a tick.
// A twig is distinct from a rite because it manages a "virtual" mutable view
// of an underlying immutable map. A tree is a layer of abstraction over a rock
// for some parts of the databse. A twig uses a single rite, but a single
// twig.grow(...) generates multiple rite.read(...) and rite.etch(...)
// because it traverses and updates the trie used to represent the tree.

class Twig {
    rite
    _mut
    constructor(prev, rite) {
        this.rite = rite
        this._mut = prev.asMutable()
    }
    read(k :Blob) :Blob {
        let skey = b2h(k)
        let val = this._mut.get(skey)
        if (val) return val
        else return h2b('')
    }
    etch(k :Blob, v :Blob) {
        let skey = b2h(k)
        this._mut.set(skey, v)
    }
    seal() {
        this._mut = this._mut.asImmutable()
        return this._mut
    }
}

type RKey = Blob

function rkey(s :string, ...args :Blob[]) :RKey {
    return Buffer.concat([t2b(s), ...args])
}

class Tree {
    rock :Rock
    bang :Tock
    _snapc
    _snaps

    // tree grows on a rock, but we try not to think about that
    constructor(rock :Rock) {
        this.rock = rock

        this._snapc = 0
        this._snaps = { "": immu.Map() } // todo, make it in lmdb
    }

    look(copy :Snap, look :((Rock,Twig) => void)) :Okay<Blob> {
        let snap = this._snaps[b2h(copy)]
        if (!snap) return fail(`read_twig: no such snap: ${copy}`)
        else {
            let ret
            this.rock.rite(rite => {
                let twig = new Twig(snap, rite) // todo, readonly
                look(this.rock, twig)
            })
        }
    }

    grow(copy :Snap, grow :((Rock,Twig,Snap) => void)) {
        let prev = this._snaps[b2h(copy)]
        let next = this._aloc()
        this.rock.rite(rite => {
            let twig = new Twig(prev, rite)
            grow(rite, twig, next)
            let immu = twig.seal()
            this._snaps[b2h(next)] = immu
        })
    }

    _aloc() :Snap {
        return n2b(BigInt(this._snapc++))
    }

}

