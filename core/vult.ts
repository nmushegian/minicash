// state transition critical path

import Debug from 'debug'
const dub = Debug('cash:vult')

import {
    need, pass, fail, aver, err,
    Work, Snap, Fees, Know, tuff,
    mash,
    Blob, bleq, blen, bcat, bnum, extend,
    roll, unroll,
    h2b, b2h, n2b, b2t, t2b,
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
    if ('DV' == b2t(know))
        return [MemoType.AskTocks, tockhash]
    if ('DN' == b2t(know))
        return [MemoType.Err, ['invalid', tockhash]]
    // haven't validated it before, proceed

    // first apply the header state -- this might be redundant, but no values should change
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

    // Try to apply the body state

    // 1. Get the last applied state (fold)
    // the last fold is either in this tock, or the prior one
    let snap, fees
    let foldkey, fold
    let tack_idx // the *next* tack index, the one we need to get
    // key length for find_max API is 29:  4 ('fold') + 24 (tockhash) + 1 (foldidx)
    // prefix is ('fold' ++ tockhash)
    tree.rock.rite(r => {
        [foldkey, fold] = r.find_max(rkey('fold', tockhash), 29)
    })
    if (blen(fold) > 0) {
        // it's in this tock, so next tack is last + 1
        dub('fold is in this tock')
        ;[snap, fees] = unroll(fold)
        tack_idx = foldkey[foldkey.length - 1] + 1
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
    let eye  = tack[1] as Blob
    let ribs = tack[2] as Blob[]
    let is_last_tack = (bnum(eye) == BigInt(ribs.length - 1))
                    || (bleq(eye, h2b('00')) && ribs.length == 0)
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
    let out
    let feenum = bnum(fees)
    try { tree.grow(snap, (rite,twig,nextsnap) => {
        ticks.forEach((tick,tick_idx) => {
            let tickhash = mash(roll(tick))
            dub(`applying tick`, tick)
            let moves = tick[0]
            let ments = tick[1]

            moves.forEach(move => {
                // TODO fee already computed in vinx, we should keep it attached
                let [txin, idx, sig] = move
                let idxnum = parseInt(b2h(idx), 16)
                if (idxnum == 7) {
                    dub('is_last_tack', is_last_tack)
                    dub('tick idx, ticks length-1', tick_idx, ticks.length - 1)
                    need( is_last_tack && (tick_idx == ticks.length - 1),
                        `invalid: move has idx 7, but it isn't the last tick`)
                    need( bleq(txin, prevhash), `invalid: move has idx 7, but txin is not prevhash`)
                    // todo set tock pent ?
                } else {
                    let conxblob = rite.read(rkey('tick', txin))
                    aver(_=> conxblob.length > 0, `panic, no context for tick in vult`)
                    let conx = unroll(conxblob)
                    let conxments = conx[1]
                    let consumed = conxments[idxnum]
                    let [, cash] = consumed
                    feenum += cash
                    let have = twig.read(rkey('ment', txin, idx))
                    need(have.length > 0, `invalid: no such ment exists: ${txin} ${idx}`)
                    let pent = twig.read(rkey('pent', txin, idx))
                    need(pent.length == 0, `invalid: ment already pent: ${txin} ${idx}`)
                    twig.etch(rkey('pent', txin, idx), roll([tickhash, tockhash]))
                }
            })

            ments.forEach((ment,idx) => {
                let [code, cash] = ment
                feenum -= bnum(cash)
                let have = twig.read(rkey('ment', tickhash, n2b(BigInt(idx))))
                need(have.length == 0, `invalid: this ment already exists`)
                // TODO pyre
                twig.etch(rkey('ment', tickhash, n2b(BigInt(idx))), roll([code, cash]))
            })
        })

        rite.etch_fold(tockhash, bnum(tack_idx), nextsnap, feenum)
        if (is_last_tack) {
            rite.etch_know(tockhash ,'DV')
            out = [MemoType.AskTocks, tockhash]
        } else {
            out = [MemoType.AskTacks, tockhash, tack_idx + 1]
        }
    }) } catch (e) {
        dub('vult throw', e.message)
        if (e.message.startsWith('invalid')) {
            tree.rock.etch_one(rkey('know', tockhash), t2b('DN'))
            return [MemoType.Err, ['invalid', e.message]]
        } else {
            dub('vult rethrow', e.message)
            throw e
        }
    }
    dub('vult success')
    return out
}
