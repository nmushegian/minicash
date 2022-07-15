// state transition critical path

import Debug from 'debug'
const dub = Debug('cash:vult')

import {
    Okay, pass, fail, aver, err,
    Work, Snap, Fees, Know, tuff,
    mash,
    Blob,
    roll, unroll, bnum, blen, extend,
    h2b, b2h, n2b, b2t, bcat,
    Memo, memo,
    MemoType, OpenMemo,
    Tick, Tock, Tack,
} from './word.js'

import { Tree, Twig, rkey } from './tree.js'

export {
    vult
}

function vult(tree :Tree, tock :Tock, thin :boolean = false) :OpenMemo {
    dub(`vult tock`, tock)
    let tockhash = mash(roll(tock))
    let [prevhash, root, time, fuzz] = tock
    dub(`tockhash`, tockhash)

    // check if we have already finished validating this tock
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


    // now try to apply the "full" state
    // 1. get the last applied state (fold)
    // 2. get the next tack to apply
    //    if not available, request it
    // 3. get all the ticks for that tack
    //    if not available, request them
    // 4. apply them
    //    if success, set fold
    //        if last fold, set know=DV
    //        else request next fold
    //    else fail, set know=DN


    // 1. Get the last applied state (fold)
    // the last fold is either in this tock, or the prior one
    let snap, fees
    let foldkey, fold
    let tack_idx
    // key length for find_max API is 29:  4 ('fold') + 24 (tockhash) + 1 (foldidx)
    // prefix is ('fold' ++ tockhash)
    tree.rock.rite(r => {
        [foldkey, fold] = r.find_max(rkey('fold', tockhash), 29)
    })
    if (blen(fold) > 0) {
        // it's in this tock, so next tack is last + 1
        dub('fold is in this tock')
        ;[snap, fees] = unroll(fold)
        tack_idx = foldkey[foldkey.length - 1]
    } else {
        // it's in the prior tock, so next tack is this tock's tack 0
        dub('fold is in prior tock')
        tree.rock.rite(r => {
            [foldkey, fold] = r.find_max(rkey('fold', prevhash), 29)
        })
        aver(_=> blen(fold) > 0, `panic: no fold in current or prior tock`)
        ;[snap, fees] = unroll(fold)
        tack_idx = h2b('00')
    }
    dub('snap, fees', snap, fees)
    dub('next_tack', tockhash, tack_idx)

    // 2. Get the next tack to apply from db, or request it
    let tackblob = tree.rock.read_one(rkey('tack', tockhash, Buffer.from([tack_idx])))
    if (blen(tackblob) == 0) {
        dub(`don't have this tack, requesting it`)
        return [MemoType.AskTacks, [tockhash, Buffer.from([tack_idx])]]
    }
    let tack = unroll(tackblob)
    dub(`have this tack, checking if we have ticks`)

    // 3. get the ticks, request missing ones
    let feet = tack[3] as Blob[]
    let ticks = []
    let miss = []
    tree.rock.rite(r => { // todo readonly
        feet.forEach(tickhash => {
            let tickblob = r.read(rkey('tick', tickhash))
            if (tickblob.length > 0) {
                ticks.push(unroll(tickblob))
            } else {
                miss.push(tickhash)
            }
        })
    })
    if (miss.length > 0) {
        return [MemoType.AskTicks, miss]
    }

    // 4. apply the ticks
    let feenum = bnum(fees)
    tree.grow(snap, (rite,twig,nextsnap) => {
        ticks.forEach(tick => {
            let tickhash = mash(roll(tick))
            dub(`applying tick`, tick)
            let moves = tick[0]
            let ments = tick[1]

            moves.forEach(move => {
                // TODO fee already computed in vinx, we should keep it attached
                let [txin, idx, sig] = move
                let idxnum = parseInt(b2h(idx), 16)
                if (idxnum == 7) {
                    dub(`todo idxnum == 7`)
                    // todo need last tick
                    // todo need txin == prevhash
                    // todo set pent
                } else {
                    let conxblob = rite.read(rkey('tick', txin))
                    aver(_=> conxblob.length > 0, `panic, no context for tick in vult`)
                    let conx = unroll(conxblob)
                    let conxments = conx[1]
                    let consumed = conxments[idxnum]
                    let [, cash] = consumed
                    feenum += cash
                    // TODO check exists
                    // TODO check not pent
                    twig.etch(rkey('pent', txin, idx), roll([tickhash, tockhash]))
                }
            })

            ments.forEach((ment,idx) => {
                let [code, cash] = ment
                feenum -= bnum(cash)
                // TODO check not exists
                // TODO pyre
                twig.etch(rkey('ment', tickhash, n2b(BigInt(idx))), roll([code, cash]))
            })
        })

        rite.etch(rkey('fold', tockhash, tack_idx), roll([nextsnap, n2b(feenum)]))
        // TODO if it's the last tack, set know
    })
    throw err(`todo vult`)
}
