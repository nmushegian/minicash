// state transition critical path

import {
    Okay, pass, fail,
    Work, Snap, Fees, Know,
    Tick, Tock, Tack,
} from './word.js'

import { Tree, Twig } from './tree.js'

export {
    vult_thin,
    vult_part,
    vult_full
}

function vult_thin(tree :Tree, tock :Tock) {
    // get prev
    // aver vinx_tock
    // head = hash(tock)
    // prev_work = rock.read ['work', prev]
    // this_work = work(head) + prev_work
    // rock.etch ['tock', head] tock
    // rock.etch ['work', head] work
    // rock.etch ['next', prev, this_work, head] true
    // twig.grow ['hist', head] true
    return fail(`todo vult_thin`)
}

function vult_full(tree :Tree, tock :Tock) {
    // for tack in ['tack', tockhash, i]
    //   twig.grow =>
    //     vult_part twig tack
    //     if invalid, rock.etch ['know', head] false
    //   fees += part.fees
    // rock.etch ['know',head] true
    // last tack snap is tock snap
    return fail(`todo vult_full`)
}

function vult_part(twig :Twig, tack :Tack) {
    // let head,i,ribs,feet
    // let tin, tout= 0
    // aver vinx_tack
    // tree.grow
    //   for tick in tack
    //     use move
    //     put ment
    //     add tin,tout
    //     grow 'hist' tickhash true
    // rock.etch 'tack' head i tack
    // rock.etch 'fold' snap in out
    // return
    return fail(`todo vult_part`)
}

