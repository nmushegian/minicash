// state transition critical path
import Debug from 'debug'
import {
    aver,
    b2h,
    b2t,
    bleq, Bnum,
    bnum, Cash, Code,
    h2b,
    mash,
    MemoAskTacks,
    MemoAskTocks,
    MemoErr,
    MemoType,
    n2b,
    need,
    roll,
    Snap,
    t2b,
    Tack,
    Tick,
    Tock,
    toss,
    tuff,
    unroll,
} from './word.js'

import {rkey, Tree} from './tree.js'
import {Blob, Roll} from "coreword";

const debug = Debug('djin::test')

export {
    vult_thin,
    vult_full
}

function latest_fold(tree :Tree, tockhash :Blob) :[Blob, Bnum]{
    let i = BigInt(0)
    let prev_tail
    while (true) {
        let tail = tree.rock.read_one(rkey('fold', tockhash, n2b(i++)))
        if (bleq(tail, t2b(''))) {
            break
        }
        prev_tail = tail
    }
    need(prev_tail != undefined, `no folds at tockhash ${b2h(tockhash)}`)
    return [prev_tail, i - BigInt(1)]
}

function know(tree :Tree, tockhash :Blob) :string {
    let res
    let prev_tail_fold = latest_fold(tree, tockhash)[0]

    let [snap,] = unroll(prev_tail_fold)
    tree.look(snap as Snap, (rock, twig) => {
        res = twig.read(rkey('know', tockhash, snap as Snap))
    })
    return b2t(res)
}

// vult_thin grows possibly-valid state tree
//   (could also invalidate tock)
function vult_thin(tree :Tree, tock :Tock) :MemoAskTocks {
    // aver prev tock must exist
    // aver well/vinx
    let head = mash(roll(tock))
    debug('vult_thin', b2h(head))
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
        // subsidy = 0x20
        rite.etch(rkey('ment', head, h2b('07')), roll([head, h2b('20')])) // [code, cash]
        twig.etch(rkey('know', head, snap), t2b('PV'))
    })
    let best = tree.rock.read_one(rkey('best'))
    let best_work = tree.rock.read_one(rkey('work', best))
    if (bnum(this_work) > bnum(best_work)) {
        debug(`WORK: ${b2h(this_work)}, ${b2h(best_work)}`)
        tree.rock.etch_one(rkey('best'), head)
    }
    debug('vult_thin: grew', b2h(head), 'to PV')
    return [MemoType.AskTocks, head]
}

function subsidy(_time :Blob) :BigInt {
    return BigInt(50)
}
// vult_full grows definitely-valid state tree
//   (could also invalidate tock)
function vult_full(tree :Tree, tock :Tock) :MemoAskTacks|MemoAskTocks|MemoErr { // :Memo
    let [prevtockhash, root, time, fuzz] = tock
    let prevtack = unroll(tree.rock.read_one(rkey('tack', prevtockhash)))
    let tockhash = mash(roll(tock))
    debug('vult_full', b2h(tockhash))
    let tockfound = !bleq(tree.rock.read_one(rkey('tock', tockhash)), t2b(''))
    if (!tockfound) {
        vult_thin(tree, tock)
        return [MemoType.AskTacks, tockhash]
    }

    let fold = tree.rock.read_one(rkey('fold', tockhash, n2b(BigInt(0))))
    let foldandidx = latest_fold(tree, tockhash)
    let foldidx = foldandidx[1]
    let [prev_snap, _prev_fees] = unroll(latest_fold(tree, tockhash)[0]) as [Snap, Blob]
    let prev_fees = bnum(_prev_fees)
    let tockknow = know(tree, tockhash)
    debug("KNOW=", tockknow)

    if ('DV' == tockknow) {
        debug('vult_full cur tock is DV, returning ask/tocks cur_tock')
        return [MemoType.AskTocks, tockhash]
    }

    if ('PV' == tockknow) {
        // todo need to do this in a loop
        debug('vult_full last tock is PV, trying to vult it')
        let prevtock = unroll(tree.rock.read_one(rkey('tock', prevtockhash))) as Tock
        let prevmemo = vult_full(tree, prevtock)
        debug('vult_full successfully vulted prev=', b2h(prevtockhash))
        if (MemoType.AskTocks != prevmemo[0]) {
            return prevmemo
        }
    }

    let firsttack_blob = tree.rock.read_one(rkey('tack', tockhash, h2b('00')))
    if (bleq(firsttack_blob, t2b(''))) {
        debug('first tack not found, asking tacks')
        return [MemoType.AskTacks, tockhash]
    }
    let [head, , ribs, feet] = unroll(firsttack_blob) as Tack
    // ribs.length == 0 if tack has fewer than 512 feet
    for (let eye = 1; eye < ribs.length; eye++) {
        let tack = tree.rock.read_one(rkey('tack', tockhash, n2b(BigInt(eye))))
        if (bleq(tack, t2b(''))) {
            return [MemoType.AskTacks, tockhash]
        }
        let feet = (unroll(tack) as Tack)[3]
        feet.push(...feet)
    }
    let ticks = feet.map(foot => {
        let tick = tree.rock.read_one(rkey('tick', foot))
        aver(_ => !bleq(tick, t2b('')), 'panic, vult, tick not found')
        return unroll(tick) as Tick
    })


    let valid = false
    let cur_snap
    let fees = BigInt(0)
    tree.grow(prev_snap as Snap, (rock, twig, snap) => {
        //try {

            ticks.forEach(tick => {
                let tickhash = mash(roll(tick))
                let [moves, ments] = tick
                moves.forEach(move => {
                    let [txin, idx, sign] = move
                    // todo why?  we can get the ment from the tick (read(rkey('tick', txin))[1][idx])
                    let ment = twig.read(rkey('ment', txin, idx))
                    need(!bleq(ment, t2b('')), 'ment must exist')
                    need(bleq(twig.read(rkey('pent', txin, idx)), t2b('')), 'move must be unspent')
                    let pyre = twig.read(rkey('pyre', txin)) // todo ok?
                    need(bnum(time) < bnum(pyre), `move can't be expired`)
                    let [code, cash] = unroll(ment) as [Code, Cash]
                    twig.etch(rkey('pent', txin, idx), h2b('ff'))
                    fees += bnum(cash)
                })
                ments.forEach((ment, idx) => {
                    twig.etch(rkey('ment', tickhash, n2b(BigInt(idx))), roll(ment))
                    let pyre = bnum(time) + BigInt(536112000) // 17y
                    twig.etch(rkey('pyre', tickhash), pyre)
                    let [code, cash] = ment
                    fees -= bnum(cash)
                })
            })
            cur_snap = snap
            valid = true
            /*
        } catch (e) {
            valid = false
            toss(e)
        }

             */
    })

    if (!valid) {
        debug("vult_full invalid", b2h(tockhash))
        tree.rock.etch_one(rkey('know', tockhash), t2b('DN'))
        return [MemoType.Err, ['unspendable', tock]]
    }

    tree.rock.etch_one(rkey('fold', tockhash, n2b(foldidx + BigInt(1))), roll([cur_snap, n2b(prev_fees + fees)]))
    debug('vult_full SUCCESS, setting DV', b2h(tockhash))
    tree.rock.etch_one(rkey('know', tockhash), t2b('DV'))
    return [MemoType.AskTocks, tockhash]

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
            // todo ? it's indexed by ('ment', txid, idx), wouldn't there need to be a collision?
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
    // todo why? should already be there...
    rock.etch ['tack head i] tack
    // todo why? is this from an old tack definition?
    if last tack {
        need fees == mint // net fee is just the subsidy
        rock.etch ['know head] 'DV // definitely-valid
        return memo( ask/tock ... )
    } else {
        return memo( ask/tack ... )
    }
    */
}
