// pure kvdb (later, parallel read / non-blocking write (mutable handles))

import * as immu from 'immutable'

import {
    Okay, pass, fail,
    Blob, blob, b2h, h2b,
    Tock, Tack,
    Mesh,
    Bnum,
    Bill,
    Stat, Snap, Know,
} from './word.js'

import {
    Rock
} from './rock.js'

export {
    Tree
}

class Tree {
    rock :Rock
    desk
    _snapc
    _snaps

    // tree grows on a rock, but we try not to think about that
    constructor(rock :Rock) {
        this.rock = rock
        this.desk = immu.Map()
        this._snapc = 0
        this._snaps = { "": this.desk }
    }

    // ['thin', tockhash] -> stat
    view_thin(tosh :Mesh) :Okay<Stat> { return fail(`todo`) }
    grow_thin(tosh :Mesh, stat :Stat) { return fail(`todo`) }

    // ['know', tockhash] -> PV | DV | PN | DN
    view_know(tosh :Mesh) :Okay<Know> { return fail(`todo`) }
    grow_know(tosh :Mesh, know :Know) { return fail(`todo`) }

    // ['part', tockhash, tackhash] -> snap
    view_part(tosh :Mesh, tash :Mesh) :Okay<Snap> { return fail(`todo`) }
    grow_part(tosh :Mesh, tash :Mesh, snap :Snap) { return fail(`todo`) }

    // ['full', tockhash] -> snap
    view_full(tosh :Mesh) :Okay<Snap> { return fail(`todo`) }
    grow_full(tosh :Mesh, snap :Snap) { return fail(`todo`) }

    // ['page', snap] -> utxo -> [[hash,cash],burn]
    view_page(copy :Snap, key :Blob) :Okay<[Bill,Bnum]> {
        let snap = this._snaps[b2h(copy)]
        return pass([[], h2b(snap)])
    }
    grow_page(copy :Snap, edit :((desk:{
        get: (key :Blob) => Blob;
        set: (key :Blob, val :Blob) => void;
    }) => void)) :Okay<Snap> {
        let mut = this.desk //.mutableCopy
        edit({
            get: (k :Blob) :Blob => {
                return (mut.get(k) as Blob)
            },
            set: (k :Blob, v :Blob) => {
                mut.set(k, v)
            }
        })
        // mut.seal()
        let snap = this._nextsnap()
        this._snaps[snap] = mut
        return pass(snap)
    }

    _nextsnap() :number {
        return this._snapc++
    }

    //  not necessary, but useful -- info *about this branch*
    //  page_ticks : snap -> (tickhash -> tockhash)  // early dup check
    //  page_tocks : snap -> (tockhash -> height)    // faster common ancestor

}
