// pure kvdb (later, parallel read / non-blocking write (mutable handles))

import * as immu from 'immutable'

import {
    Okay, pass, fail,
    Blob, blob, b2h, h2b,
    Tock, Tack,
    Mash,
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
    read_thin(tosh :Mash) :Okay<Stat> { return fail(`todo`) }
    grow_thin(tosh :Mash, stat :Stat) { return fail(`todo`) }

    // ['know', tockhash] -> PV | DV | PN | DN
    read_know(tosh :Mash) :Okay<Know> { return fail(`todo`) }
    grow_know(tosh :Mash, know :Know) { return fail(`todo`) }

    // ['part', tockhash, tackhash] -> snap
    read_part(tosh :Mash, tash :Mash) :Okay<Snap> { return fail(`todo`) }
    grow_part(tosh :Mash, tash :Mash, snap :Snap) { return fail(`todo`) }

    // ['full', tockhash] -> snap
    read_full(tosh :Mash) :Okay<Snap> { return fail(`todo`) }
    grow_full(tosh :Mash, snap :Snap) { return fail(`todo`) }

    // ['page', snap] -> utxo -> [[hash,cash],burn]
    read_page(copy :Snap, key :Blob) :Okay<[Bill,Bnum]> {
        let snap = this._snaps[b2h(copy)]
        return pass([[], h2b(snap)])
    }
    grow_page(copy :Snap, edit :((_:{
        get: (key :Blob) => Blob;
        set: (key :Blob, val :Blob) => void;
    }) => void)) :Okay<Snap> {
        let prev = this._snaps[b2h(copy)]
        let next = prev.withMutations(page => {
            edit({
                get: (k :Blob) :Blob => {
                    return page.get(k) as Blob
                },
                set: (k :Blob, v :Blob) => {
                    page.set(k, v)
                }
            })
        })
        let snap = this._nextsnap()
        this._snaps[b2h(snap)] = next
        return pass(snap)
    }

    _nextsnap() :Snap {
        let hexnum = (this._snapc++).toString(16)
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

