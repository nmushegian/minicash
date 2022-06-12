// state transition
// we keep track of a tree of headers and thin state
//   thin state is immutable except for `know`, which can invalidate a tock
//   this immutable state tree is represented directly in our Tree
// we also keep track of a full state of unspent UTXOs
//   full state is immutable
//   it is represented with a pure map, we store snaps per tock in Tree

import {
    Okay, pass, fail,
    Stat, Know,
    Tick, Tock,
} from './word.js'

import { Rock } from './rock.js'
import { Tree } from './tree.js'

export {
    vult_thin,
    vult_full
}

// only `desk` is represented as immutable set, one snap at each tock
// the rest are insert-only values, except `know` can have one-way
// transition from possibly-* to definitly-*

// !mutates tree:
//   insert stat
//   insert know = PV
function vult_thin(rock :Rock, tree :Tree, tock:Tock) :Okay<Stat> {
    return fail(`todo`)
}

// !warn returns [true, false, _] result when vult fails
//    - this is still a successful state transition which
//      still causes a mutation:  possibly_valid -> definitely_invalid
//    - [false, _, err] result is returned when there is *not enough info*
//      this should be a panic at engine level as it should only attempt
//      this when it has all the ticks available
// !mutates tree:
//   insert desk snap
//   update know
function vult_full(rock :Rock, tree:Tree, tock:Tock, ticks :Tick[]) :Okay<boolean> {
    return fail(`todo`)
}
