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
    return fail(`todo vult_thin`)
}

function vult_full(tree :Tree, tock :Tock) :Okay<Snap> {
    return fail(`todo vult_full`)
}

function vult_part(twig :Twig, tack :Tack) :Okay<Snap> {
    return fail(`todo vult_part`)
}

