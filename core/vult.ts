// state transition critical path

import Debug from 'debug'
const dub = Debug('cash:vult')

import {
    Okay, pass, fail, aver, err,
    Work, Snap, Fees, Know, tuff,
    mash,
    roll, unroll, bnum, blen, extend,
    h2b, b2h, n2b, b2t, bcat,
    Memo, memo,
    MemoType, OpenMemo,
    Tick, Tock, Tack,
} from './word.js'

import { Tree, Twig, rkey } from './tree.js'

export {
    vult
//    vult_thin,
//    vult_full
}

function vult(tree :Tree, tock :Tock, thin :boolean = false) :OpenMemo {
    dub(`vult tock`, tock)
    let tockhash = mash(roll(tock))
    let [prevhash, root, time, fuzz] = tock
    dub(`tockhash`, tockhash)


    // first check if we have already finished validating this tock
    let know = tree.rock.read_one(rkey('know', tockhash))
    if ('DV' == b2t(know)) {
        return [MemoType.AskTocks, tockhash]
    }
    if ('DN' == b2t(know)) {
        return [MemoType.Err, ['invalid', tockhash]]
    }
    // haven't validated it before, proceed


    // first apply the "thin" state -- this might be redundant, but no values should change
    // - work, the total work
    // - left, a running counter of remaining subsidy
    // (aver that the prev is present and its thin state was set)
    aver(_=> {
        let prevwork = tree.rock.read_one(rkey('work', prevhash))
        if (blen(prevwork) == 0) return false
        let time = bnum(tock[2])
        let prevtime = time - BigInt(57)
        let prevleft = tree.rock.read_one(rkey('left', extend(n2b(prevtime), 7)))
        if (blen(prevleft) == 0) return false
        return true
    }, `panic: in vult, has no prev tock info`)

    tree.rock.rite(r => {
        // work is previous work plus `tuff(tockhash)`
        let prevwork = r.read(rkey('work', prevhash))
        let work = prevwork + tuff(tockhash)
        r.etch_work(tockhash, work)
        // left is indexed by timestamp bc its the same regardless of branch
        let time = bnum(tock[2])
        let prevtime = time - BigInt(57)
        let prevleft = r.read(rkey('left', extend(n2b(prevtime), 7)))
        let left = bnum(prevleft) / (BigInt(2)**BigInt(21))
        r.etch_left(time, left)
    })
    // TODO, insert tockhash as ment?


    // now try to apply the "full" state
    // 1. get the last applied state (fold)
    // 2. get the next tack to apply
    //    if not available, request it
    // 3. get all the ticks for that tack
    //    if not available, request them
    // 4. apply them
    //    if success, set fold, if last fold, set know=DV
    //    if fail, set know=DN

    // 1. Get the last applied state (fold)
    // the last fold is either in this tock, or the prior one
    // key length is 29:  4 ('fold') + 24 (tockhash) + 1 (foldidx)
    // prefix is ('fold' ++ tockhash)
    let snap, fees
    let foldkey, fold
    let next_tack
    tree.rock.rite(r => {
        [foldkey, fold] = r.find_max(rkey('fold', tockhash), 29)
    })
    if (blen(fold) != 0) {
        dub('fold is in this tock')
        // it's in this tock
        ;[snap, fees] = unroll(fold)
        next_tack = Buffer.from(foldkey)
        next_tack[28] = next_tack[28] + 1
    } else {
        dub('fold is in prior tock')
        // it's in the prior tock
        tree.rock.rite(r => {
            [foldkey, fold] = r.find_max(rkey('fold', prevhash), 29)
        })
        aver(_=> blen(fold) > 0, `panic: no fold in current or prior tock`)
        ;[snap, fees] = unroll(fold)
        next_tack = bcat(tockhash, h2b('00'))
    }
    dub('snap, fees', snap, fees)
    dub('next_tack', next_tack)


    throw err(`todo vult`)
}

/*
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
*/

    /*
// vult_full grows definitely-valid state tree
//   (could also invalidate tock)
function vult_full(tree :Tree, tock :Tock) { // :Memo

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

    return fail(`todo vult_full`)

}
    */
