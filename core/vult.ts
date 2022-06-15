// state transition critical path

import {
    Okay, pass, fail,
    Work, Snap, Fees, Know,
    Tick, Tock, Tack,
} from './word.js'

import { Tree, Twig } from './tree.js'

export {
    vult_thin,
    vult_full
}

function vult_thin(tree :Tree, tock :Tock) :Okay<Work> {
    return fail(`todo`)
}

// !warn returns [true, false, _] result when vult fails in case
//      - missing info: returns needed mail
//      - block invalidation: possibly_valid -> definitely_invalid
//   - false result is an engine panic
function vult_full(tree :Tree, tock :Tock) :Okay<Snap> {
    return fail(`todo`)
}

function vult_tack(twig :Twig, tack :Tack) :Okay<Fees> {
    return fail(`todo`)
}

// utxo use / new
function vult_tick(twig :Twig, tick :Tick) :Okay<Fees> {
    return fail(`todo`)
}
