// state transition critical path

import Debug from 'debug'
const dub = Debug('cash:vult')

import {
    need, pass, fail, aver, err,
    Work, Snap, Fees, Know,
    mash, tuff,
    Blob, bleq, blen, bcat, bnum, extend,
    roll, unroll,
    h2b, b2h, n2b, b2t, t2b,
    Memo, memo, MemoType, OpenMemo,
    Tick, Tock, Tack,
} from './word.js'

import { Tree, Twig } from './tree.js'
import { rkey } from './rock.js'

export { vult }

function vult(tree :Tree, tock :Tock) :OpenMemo {
    dub(`vult tock`, tock)
    let tockhash = mash(roll(tock))
    let [prevhash, root, time, fuzz] = tock
    dub(`tockhash`, tockhash)

    // check if we have already finished validating this tock
    let know = tree.rock.read_one(rkey('know', tockhash))
    if ('DV' == b2t(know))
        return [MemoType.AskTock, tockhash]
    if ('DN' == b2t(know))
        return [MemoType.Err, [t2b('invalid'), tockhash]]
    // haven't validated it before, proceed

    // First apply the header state (might be redundant write, but won't change)
    let work // save for if we update `best`
    tree.rock.rite(r => {
        let prevwork = r.read(rkey('work', prevhash))
        work = prevwork + tuff(tockhash)
        r.etch_work(tockhash, work)
    })

    // Try to apply the body state

    // 1. Get the last applied state (fold)
    // the last fold is either in this tock, or the prior one
    let snap, fees
    let foldkey, fold
    let tack_idx // the *next* tack index, the one we need to get
    // key length for find_max API is 29:  4 ('fold') + 24 (tockhash) + 1 (foldidx)
    // prefix is ('fold' ++ tockhash), we're looking for last idx
    tree.rock.rite(r => {
        [foldkey, fold] = r.find_max(rkey('fold', tockhash), 29)
    })
    if (blen(fold) > 0) {
        // TODO test coverage
        // it's in this tock, so next tack is last + 1
        dub('fold is in this tock')
        ;[snap, fees] = unroll(fold) // continue from partial fee total
        tack_idx = n2b(bnum(foldkey[blen(foldkey) - 1]) + BigInt(1))
    } else {
        // it's in the prior tock, so next tack is this tock's tack 0
        dub('fold is in prior tock')
        tree.rock.rite(r => {
            [foldkey, fold] = r.find_max(rkey('fold', prevhash), 29)
        })
        ;[snap, ] = unroll(fold) // continue from this snap, but...
        fees = h2b('00')         // the fees are reset, we are in new tock
        tack_idx = h2b('00')
    }
    aver(_ => blen(fold) > 0, `vult: prev fold not found`)
    dub('snap, fees', snap, fees)
    dub('next_tack', tockhash, tack_idx)

    // 2. Get the next tack to apply from db, or request it
    let tackblob = tree.rock.read_one(rkey('tack', tockhash, Buffer.from([tack_idx])))
    if (blen(tackblob) == 0) {
        dub(`don't have this tack, requesting it`)
        return [MemoType.AskTack, [tockhash, Buffer.from([tack_idx])]]
    }
    let tack = unroll(tackblob)
    let eye  = tack[1] as Blob
    let ribs = tack[2] as Blob[]
    let is_last_tack = (bnum(eye) == BigInt(ribs.length - 1))     // it's the last rib
                    || (bleq(eye, h2b('00')) && ribs.length == 0) // or there are no ribs
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
    let out // for return value, b/c we have to commit db write before returning
    let feenum = bnum(fees)
    // exceptions starting with 'invalid' are intentional, and invalidate the tock
    // other exceptions are unintentional / panic, don't mark them invalid
    // TODO this is the critical path, pull as much as possible outside of this db write lock
    try { tree.grow(snap, (rite,twig,nextsnap) => {
        ticks.forEach((tick,tick_idx) => {
            let tickhash = mash(roll(tick))
            dub(`applying tick`, tick)
            let moves = tick[0]
            let ments = tick[1]
            let is_last_tick = false // computed in moves loop, used in ments loop
            let subsidy              // computed in moves loop, used in ments loop

            moves.forEach(move => {
                let [txin, idx, sig] = move
                let idxnum = parseInt(b2h(idx), 16)
                if (idxnum == 7) {
                    // This special case is for the "mint" tick, the point is to
                    // isolate all special cases into one place to keep the spec small.
                    // Vinx check ensures this tick has only 1 move and 1 ment
                    is_last_tick = is_last_tack && (tick_idx == ticks.length - 1)
                    need( is_last_tick, `invalid: move has idx 7, but it isn't the last tick`)
                    need( bleq(txin, prevhash), `invalid: move has idx 7, but txin is not prevhash`)
                    // determine subsidy based on previous tock ment (1 / 2^21 of remaining)
                    let prev_tock_ment = twig.read(rkey('ment', prevhash, h2b('07')))
                    let [_, prev_left] = unroll(prev_tock_ment)
                    subsidy = bnum(prev_left as Blob) / (BigInt(2)**BigInt(21))
                    let left = bnum(prev_left as Blob) - subsidy
                    // the tockhash is a virtual UTXO that contains remaining subsidy
                    // this ment can be used for fast ancestor check, per-branch
                    // this pent can be used for getting the next tock, per-branch
                    console.log("ETCHING PENT", b2h(prevhash), "AT SNAP", b2h(nextsnap), "key=", b2h(rkey('pent', prevhash, h2b('07'))), "tackidx", tack_idx)
                    twig.etch(rkey('pent', prevhash, h2b('07')), roll([tickhash, tockhash]))
                    twig.etch(rkey('ment', tockhash, h2b('07')), roll([h2b(''), n2b(left), h2b('')]))
                } else {
                    // regular case, not a "mint" tick, simple exists-and-unspent check
                    let ment = twig.read(rkey('ment', txin, idx))
                    let pent = twig.read(rkey('pent', txin, idx))
                    need(ment.length > 0, `invalid: no such ment exists: ${txin} ${idx}`)
                    need(pent.length == 0, `invalid: ment already pent: ${b2h(txin)} ${b2h(idx)}`)
                    let [code, cash, pyre] = unroll(ment)
                    need(bnum(time) < bnum(pyre as Blob), `invalid: expired ment ${txin} ${idx}`)
                    feenum += bnum(cash as Blob)
                    twig.etch(rkey('pent', txin, idx), roll([tickhash, tockhash]))
                }
            })

            ments.forEach((ment,idx) => {
                let [code, cash] = ment
                if (is_last_tick) {
                    need(bnum(cash) == subsidy + feenum, `invalid: mint tick has bad amount`)
                } else {
                    feenum -= bnum(cash)
                }
                let dupe = twig.read(rkey('ment', tickhash, n2b(BigInt(idx))))
                need(dupe.length == 0, `invalid: this ment already exists`)
                let pyre = n2b(bnum(time) + BigInt(17 * 365.25 * 24 * 60 * 60))
                twig.etch(rkey('ment', tickhash, n2b(BigInt(idx))), roll([code, cash, pyre]))
            })
        })

        console.log(rite.find_max(rkey('fold', prevhash), 29), b2h(snap), b2h(nextsnap))
        rite.etch_fold(tockhash, bnum(tack_idx), nextsnap, feenum)
        console.log(rite.find_max(rkey('fold', prevhash), 29))
        if (is_last_tack) {
            console.log("SETTING DV")
            rite.etch_know(tockhash ,'DV')
            let prev_best = rite.read(rkey('best'))
            let best_work = rite.read(rkey('work', prev_best))
            if (work > bnum(best_work)) {
                rite.etch_best(tockhash)
            }
            out = [MemoType.AskTock, tockhash]
        } else {
            out = [MemoType.AskTack, tockhash, tack_idx + 1]
        }
    }) /* try tree.grow */ } catch (e) {
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
