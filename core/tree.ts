// pure kvdb, parallel read / non-blocking write (mutable handles)

import * as immu from 'immutable'

import {
    Okay, pass, fail,
    Blob, blob,
    Tock,
    Mesh,
    Bnum,
    Bill,
    Stat, Snap, Know,
} from './type.js'
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

    // ['thin', tockhash] -> [tock,stat]
    thin_get(tosh :Mesh) :Okay<[Tock,Stat]> { return fail(`todo`) }
    thin_add(tock :Tock) {}

    // ['know', tockhash] -> PV | DV | PN | DN
    know_get(tosh :Mesh) :Okay<Know> { return fail(`todo`) }
    know_set(tosh :Mesh, know :Know) {}

    // ['snap', tockhash] -> snap
    full_add(tock :Tock, snap :Snap) {}
    full_get(tosh :Mesh) :Okay<Snap> { return fail(`todo`) }

    // ['page', snap] -> ( utxo -> [[hash,cash],burn] )
    page_read(copy :Snap, key :Blob) :Okay<[Bill,Bnum]> {
        let snap = this._snaps[copy.toString('hex')]
        return pass([[], blob('')])
    }
    page_edit(copy :Snap, editor :((desk:{
        get: (key :Blob) => Blob;
        set: (key :Blob, val :Blob) => void;
    })=>void)) :Okay<Snap> {
        let mut = this.desk //.mutableCopy
        editor({
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

