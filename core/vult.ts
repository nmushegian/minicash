// state transition critical path
import Debug from 'debug'
const debug = Debug('djin::test')

import {
    aver,
    b2h, bleq,
    bnum,
    fail,
    h2b,
    mash,
    MemoAskTocks,
    MemoType,
    n2b, need,
    OpenMemo,
    roll,
    Snap, t2b, Tack,
    Tock, toss,
    tuff,
    unroll,
} from './word.js'

import {rkey, Tree} from './tree.js'

export {
    vult_thin,
    vult_full
}

// vult_thin grows possibly-valid state tree
//   (could also invalidate tock)
function vult_thin(tree :Tree, tock :Tock) :OpenMemo {
    // aver prev tock must exist
    // aver well/vinx
    let head = mash(roll(tock))
    let prev_head = tock[0]
    let prev_tock = unroll(tree.rock.read_one(rkey('tock', prev_head)))
    aver(_ => prev_tock.length > 0, `vulting a tock with unrecognized prev`)
    let prev_work = tree.rock.read_one(rkey('work', prev_head))
    let this_work = n2b(bnum(prev_work) + tuff(head))
    let prev_fold = tree.rock.read_one(rkey('fold', prev_head, n2b(BigInt(0))))
    aver(_ => prev_fold.length > 0, `prev fold must exist`)
    let [prev_snap, ,] = unroll(prev_fold)
    tree.grow(prev_snap as Snap, (rite, twig, snap) => {
        rite.etch(rkey('tock', head), roll(tock))
        rite.etch(rkey('work', head), this_work)
        rite.etch(rkey('fold', head, h2b('00')), roll([snap, h2b('00')])) // [snap, fees]
        twig.etch(rkey('ment', head, h2b('07')), roll([head, h2b('00')])) // [code, cash]
        // pent only set by vult_full, where we will know the foot tick
        //twig.etch(rkey('pent', prev_head, h2b('07')), roll([head, foot])
    })
    let best = tree.rock.read_one(rkey('best'))
    let best_work = tree.rock.read_one(rkey('work', best))
    if (bnum(this_work) > bnum(best_work)) {
        debug(`WORK: ${b2h(this_work)}, ${b2h(best_work)}`)
        tree.rock.etch_one(rkey('best'), head)
    }
    return [MemoType.AskTocks, head]
}

// vult_full grows definitely-valid state tree
//   (could also invalidate tock)
function vult_full(tree :Tree, tock :Tock) :OpenMemo{ // :Memo
    let [prev, root, time, fuzz] = tock
    let prevtack = unroll(tree.rock.read_one(rkey('tack', prev)))
    let tockhash = mash(roll(tock))
    let tack = unroll(tree.rock.read_one(rkey('tack', tockhash))) as Tack
    let [head, eye, ribs, feet] = tack
    let ticks = feet.map(foot => this.rock.read_one(rkey('tick', foot)))

    let prev_fold = tree.rock.read_one(rkey('fold', tockhash, eye))
    let [prev_snap, prev_fees] = unroll(prev_fold)

    let fees = 0
    let valid
    let next_snap = tree.grow(prev_snap as Snap, (rock, twig, snap) => {
        try {
            ticks.forEach(tick => {
                let [moves, ments] = tick
                moves.forEach(move => {
                    let [txin, idx, sign] = move
                    need(!bleq(twig.read(rkey('ment', txin, idx)), t2b('')), 'move must exist')
                    need(bleq(twig.read(rkey('pent', txin, idx)), t2b('')), 'move must be unspent')
                    let pyre = Number(twig.read(rkey('pyre', txin, idx)))
                    need(time < pyre, `move can't be expired`)
                })
            })
        } catch (e) {toss(e)}
    })
    /*
    let last = rock.read ... last applied tack
    let tack = rock.read ... this tack
    let ticks = rock.read ...
    let [head,i,ribs,feet] = tack

    // let [prev_snap, prev_fees] = r.read([ 'fold', tockhash, i ])

    let time = tock.time
    let fees = 0
    let valid
    let next_snap = tree.grow(prev_snap, twig => {
      try {
        for tick in ticks {
          for move in moves {
            need twig.has ['ment' move.mark]   // move exists
            need !twig.has ['pent' move.mark]  // not spent
            need time < pyre                   // not expired
            let [_code,cash] = twig.read(move.mark)
            put pent                           // mark it spent
            fees += cash
          }
          for ment in ments {
            need !twig.has 'ment' ment         // not exists
            put ment                           // put utxo
            put pyre = time + 17y              // put expiry
            fees -= ment.cash
          }
          valid = true
        }
      } catch err {
        valid = false
        throw err
      }
    })

    if (!valid) {
        rock.etch ['know head] 'DN  // definitely-not-valid
        return memo( err / ... )
    }

    let fees = pfees + fees
    rock.etch ['fold head i] [next fees]
    rock.etch ['tack head i] tack
    if last tack {
        need fees == mint // net fee is just the subsidy
        rock.etch ['know head] 'DV // definitely-valid
        return memo( ask/tock ... )
    } else {
        return memo( ask/tack ... )
    }
    */
    return fail(`todo vult_full`)

}
