// pure kvdb (later, parallel read / non-blocking write (mutable handles))

// temporary in-memory implementation until we make the db

import * as immu from 'immutable'

import {
    Okay, pass, fail,
    Roll, Blob, roll, unroll, b2h, h2b, t2b, n2b,
    Snap, Tock,
} from './word.js'

import {
    Rock, rkey
} from './rock.js'

export {
    Tree, Twig
}

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


class Tree {
    rock :Rock
    _snapc
    _snaps

    // tree grows on a rock, but we try not to think about that
    constructor(rock :Rock) {
        this.rock = rock

        this._snapc = 0
        this._snaps = { "": immu.Map() } // todo, make it in lmdb
    }

    look(copy :Snap, look :((Rock,Twig) => void)) {
        let snap = this._snaps[b2h(copy)]
        if (!snap) return fail(`read_twig: no such snap: ${copy}`)
        else {
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

