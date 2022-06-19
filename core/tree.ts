// pure kvdb (later, parallel read / non-blocking write (mutable handles))

import * as immu from 'immutable'

import {
    Okay, pass, fail,
    Roll, Blob, roll, unroll, b2h, h2b, t2b,
    Snap,
} from './word.js'

import {
    Rock
} from './rock.js'

export {
    Tree, Twig, rkey
}

// mutable handle
class Twig {
    rite
    _mut
    constructor(prev, rite) {
        this.rite = rite
        this._mut = prev.asMutable()
    }
    get(k :Blob) :Blob {
        let skey = b2h(k)
        let val = this._mut.get(skey)
        if (val) return val
        else return h2b('')
    }
    set(k :Blob, v :Blob) {
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
    _snapc
    _snaps

    // tree grows on a rock, but we try not to think about that
    constructor(rock :Rock) {
        this.rock = rock
        this._snapc = 0
        this._snaps = { "": immu.Map() } // todo, make it in lmdb
    }

    look(copy :Snap, look :((Twig) => void)) :Okay<Blob> {
        let snap = this._snaps[b2h(copy)]
        if (!snap) return fail(`read_twig: no such snap: ${copy}`)
        else {
            let ret
            this.rock.rite(slab => {
                let twig = new Twig(snap, slab) // todo, readonly
                look(twig)
            })
        }
    }

    grow(copy :Snap, next :Snap, grow :((Twig) => void)) {
        let prev = this._snaps[b2h(copy)]
        this.rock.rite(r => {
            let twig = new Twig(prev, r)
            grow(twig)
            let immu = twig.seal()
            this._snaps[b2h(next)] = immu
        })
    }


}

