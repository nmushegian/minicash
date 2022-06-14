// state transition
// rock provides the base of content-addressed data that is available
// we keep track of a tree of headers and thin state
//   this state tree is represented directly in our Rock
// we also keep track of a full state of unspent UTXOs
//   it is represented with a pure map, we store snaps per tock in Tree

import {
    Okay, pass, fail,
    Bnum, Stat, Know,
    Tick, Tock, Tack,
    Memo
} from './word.js'

import { Rock } from './rock.js'
import { Tree } from './tree.js'

export {
    vult_thin,
    vult_full
}

// only `page` (utxo set) is represented as immutable set, one snap at each tock
// the rest are insert-only values, except `know` can have one-way
// transition from possibly-* to definitly-*
function vult_thin(rock :Rock, tree :Tree, tock :Tock) :Okay<Memo> {
    return fail(`todo`)
}

// !warn returns [true, false, _] result when vult fails in case:
//      - missing info: returns needed mail
//      - block invalidation: possibly_valid -> definitely_invalid
//   - false result is an engine panic
function vult_full(rock :Rock, tree :Tree, tock :Tock) :Okay<Memo> {
    return fail(`todo`)
}
