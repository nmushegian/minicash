// state transition critical path

import {
    Okay, pass, fail, aver,
    Work, Snap, Fees, Know, tuff,
    mash, roll, unroll, bnum,
    h2b, n2b, bcat,
    Memo, memo,
    MemoType, OpenMemo,
    Tick, Tock, Tack,
} from './word.js'

import { Tree, Twig, rkey } from './tree.js'

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
    let prev_work = tree.rock.read_one(rkey('work', prev_head))
    let this_work = n2b(bnum(prev_work) + tuff(head))
    let prev_fold = tree.rock.read_one(rkey('fold', prev_head, n2b(BigInt(0))))
    aver(_=> prev_fold.length > 0, `prev fold must exist`)
    let [prev_snap,,] = unroll(prev_fold)
    tree.grow(prev_snap as Snap, (rite,twig,snap) => {
        rite.etch(rkey('tock', head), roll(tock))
        console.log('vult_thin oetched tock', head)
        rite.etch(rkey('work', head), this_work)
        rite.etch(rkey('fold', head, h2b('00')), roll([snap, h2b('00')])) // [snap, fees]
        twig.etch(rkey('ment', head, h2b('07')), roll([head, h2b('00')])) // [code, cash]
        // pent only set by vult_full, where we will know the foot tick
        //twig.etch(rkey('pent', prev_head, h2b('07')), roll([head, foot])
    })
    return [MemoType.AskTocks, head]
}

// vult_full grows definitely-valid state tree
//   (could also invalidate tock)
function vult_full(tree :Tree, tock :Tock) { // :Memo
    /*
    let last = rock.read ... last applied tack
    let tack = rock.read ... this tack
    let ticks = rock.read ...
    let [head,i,ribs,feet] = tack

    let [prev_snap, prev_fees] = r.read([ 'fold', tockhash, i ])

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
