// pure kvdb (later, parallel read / non-blocking write (mutable handles))

import * as immu from 'immutable'

import {
    Okay, pass, fail,
    Blob, blob, b2h, h2b,
    Tock, Tack,
    Mash,
    Bnum,
    Bill,
    Stat, Snap, Know, Fees,
} from './word.js'

import {
    Rock
} from './rock.js'

export {
    Tree
}

// mutable handle
class Leaf {
    _mut
    constructor(prev) {
        this._mut = prev.asMutable()
    }
    get(k :Blob) :Blob {
        let skey = k.toString('binary')
        let val = this._mut.get(skey)
        if (val) return val
        else return blob('')
    }
    set(k :Blob, v :Blob) {
        let skey = k.toString('binary')
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
        this._snaps = { "": immu.Map() }
    }

    // ['thin', tockhash] -> stat
    read_thin(tosh :Mash) :Okay<Stat> { return fail(`todo`) }
    grow_thin(tosh :Mash, stat :Stat) { return fail(`todo`) }

    // ['know', tockhash] -> PV | DV | PN | DN
    read_know(tosh :Mash) :Okay<Know> { return fail(`todo`) }
    grow_know(tosh :Mash, know :Know) { return fail(`todo`) }

    // ['part', tockhash, tackhash] -> [snap,fees]
    read_part(tosh :Mash, tash :Mash) :Okay<[Snap,Fees]> { return fail(`todo`) }
    grow_part(tosh :Mash, tash :Mash, snap :Snap) { return fail(`todo`) }

    // ['full', tockhash] -> snap
    read_full(tosh :Mash) :Okay<Snap> { return fail(`todo`) }
    grow_full(tosh :Mash, snap :Snap) { return fail(`todo`) }

    // ['page', snap] -> utxo -> [[hash,cash],burn]
    read_page(copy :Snap, key :Blob) :Okay<Blob> {
        let page = this._snaps[b2h(copy)]
        if (!page) return fail(`read_page: no such snap: ${copy}`)
        else {
            let leaf = new Leaf(page) // readonly
            let val = leaf.get(key)
            return pass(val)
        }
    }
    grow_page(copy :Snap, edit :((Leaf) => void)) :Okay<Snap> {
        let prev = this._snaps[b2h(copy)]
        let leaf = new Leaf(prev)
        edit(leaf)
        let next = leaf.seal()
        let snap = b2h(this._nextsnap())
        this._snaps[snap] = next
        return pass(h2b(snap))
    }

    _nextsnap() :Snap {
        let hexnum = (++this._snapc).toString(16)
        let hexblob = blob(hexnum)
        return hexblob
    }

    //  not necessary, but useful:

    //    early dup check
    //      ['tickpage', snap] -> tickhash -> tockhash)
    //      read_tickpage
    //      grow_tickpage

    //    fast common ancestor
    //      ['tockpage', snap] -> tockhash -> height
    //      read_tockpage
    //      grow_tockpage

}

