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
    vult_full
}

function vult_thin(tree :Tree, tock :Tock) {
    // aver prev tock must exist
    let head = mash(roll(tock))
    let prev_head = tock[0]
    let prev_tock = unroll(tree.rock.read_one(rkey('tock', prev_head)))
    let prev_work = tree.rock.read_one(rkey('work', prev_head))
    let this_work = bnum(prev_work) + tuff(head)
    let [prev_snap,,] = unroll(tree.rock.read_one(rkey('fold', prev_head)))
    // todo prev_know
    tree.grow(prev_snap as Snap, head as Snap, twig => {
        twig.rite.etch(rkey('tock', head), roll(tock))
        twig.rite.etch(rkey('work', head), this_work)
        twig.rite.etch(rkey('fork', prev_head, n2b(this_work), head), true)
        // todo propogate know invalid
        twig.set(rkey('hist', head), true)
    })
}

function vult_full(tree :Tree, tock :Tock) {
    // aver well/vinx

    /*
      aver valid/invalid propogated by vult_thin
      determine last applied tack
          ['fold,tockhash,i]  max i in rock

    let tack = rock.read ...
    let ticks = rock.read ...
    let [head,i,ribs,feet] = tack
    let [tin, tout] = [0,0]

    let [snap, pin, pout] = r.read([ 'fold', tockhash, i ])
    let next = snapkey(['fold', tockhash, i])

    let valid
    tree.grow(snap, next, twig => {
      try {
      for tick in ticks:
        for move in moves:
          need ment
          need not pent
          need not pyred
          put pent
          tin +=
        for ment in ments:
          aver not exists
          put ment
          put pyre
          tout +=
       } catch (e) {
          valid = false
          throw e // abort tx, set knowstate after
       }
    })
    if (valid) {
        rock.etch ['fold head i] [snap tin tout]
        rock.etch ['tack head i] tack
        if last tack:
          need net fee+subsidy
          rock.etch ['know head] 'DV
    } else {
        rock.etch ['know head] 'DN  // definitely-not-valid
    }
    // if invalid, rock.etch ['know', head] false

    */
    return fail(`todo vult_full`)

}
