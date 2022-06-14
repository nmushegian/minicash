// state transition critical path

import {
    Okay, pass, fail,
    Bnum, Stat, Know,
    Tick, Tock, Tack,
    Memo
} from './word.js'

import { Tree } from './tree.js'

export {
    vult_thin,
    vult_full
}

function vult_thin(tree :Tree, tock :Tock) :Okay<Memo> {
    return fail(`todo`)
}

// !warn returns [true, false, _] result when vult fails in case
//      - missing info: returns needed mail
//      - block invalidation: possibly_valid -> definitely_invalid
//   - false result is an engine panic
function vult_full(tree :Tree, tock :Tock) :Okay<Memo> {
    return fail(`todo`)
}
