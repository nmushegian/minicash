// pure kvdb (later, parallel read / non-blocking write (mutable handles))

import * as immu from 'immutable'

import {
    Okay, pass, fail,
    Roll, Blob, roll, b2h, h2b,
    Snap
} from './word.js'

import {
    Rock
} from './rock.js'

export {
    Tree, Twig
}

// mutable handle
class Twig {
    _mut
    constructor(prev) {
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

    read_rock(rkey :Roll) :Blob {
        let key = roll(rkey)
        return this.rock.read(key)
    }

    read_twig(copy :Snap, key :Blob) :Okay<Blob> {
        let snap = this._snaps[b2h(copy)]
        if (!snap) return fail(`read_twig: no such snap: ${copy}`)
        else {
            let twig = new Twig(snap) // todo, readonly
            let val = twig.get(key)
            return pass(val)
        }
    }

    grow_twig(copy :Snap, grow :((Twig) => void)) :Okay<Snap> {
        let prev = this._snaps[b2h(copy)]
        let twig = new Twig(prev)
        grow(twig)
        let next = twig.seal()
        let snap = b2h(this._nextsnap())
        this._snaps[snap] = next
        return pass(h2b(snap))
    }

    _nextsnap() :Snap {
        let hexnum = (++this._snapc).toString(16)
        let hexblob = h2b(hexnum)
        return hexblob
    }


}

