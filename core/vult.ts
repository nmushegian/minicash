// state transition critical path

import {
    Okay, pass, fail,
    Work, Snap, Fees, Know, tuff,
    mash, roll, unroll, bnum,
    h2b, n2b,
    Tick, Tock, Tack,
} from './word.js'

import { Tree, Twig, rkey } from './tree.js'

export {
    vult_thin,
    vult_part,
    vult_full
}

function vult_thin(tree :Tree, tock :Tock) {
    let head = mash(roll(tock))
    let prev_head = tock[0]
    let prev_tock = unroll(tree.rock.read_one(rkey('head', prev_head)))
    let prev_work = tree.rock.read_one(rkey('work', prev_head))
    let this_work = bnum(prev_work) + tuff(head)
    let [prev_snap,,] = unroll(tree.rock.read_one(rkey('snap', prev_head)))
    tree.grow(prev_snap as Snap, head as Snap, twig => {
        twig.rite.etch(rkey('tock', head), roll(tock))
        twig.rite.etch(rkey('work', head), this_work)
        twig.rite.etch(rkey('next', prev_head, n2b(this_work), head), true)
        twig.set(rkey('hist', head), true)
    })
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

