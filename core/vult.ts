// state transition critical path
import Debug from 'debug'
import {
    aver,
    b2h,
    b2t,
    bleq,
    Bnum,
    bnum,
    Cash,
    Code,
    h2b,
    mash,
    memo_close,
    MemoAskTacks,
    MemoAskTicks,
    MemoAskTocks,
    MemoErr,
    MemoType,
    n2b,
    need,
    rmap,
    roll,
    Snap,
    t2b,
    Tack,
    Tick,
    Tock,
    tuff,
    unroll
} from './word.js'

import {rkey, Tree} from './tree.js'
import {Blob} from "coreword";
import {Rite} from "./rock";

const debug = Debug('vult::test')

export {
    vult_thin,
    vult_full
}

function etch_best(rite, tockhash :Blob) {
    let this_work = rite.read(rkey('work', tockhash))
    let best = rite.read(rkey('best'))
    let best_work = rite.read(rkey('work', best))
    if (bnum(this_work) > bnum(best_work)) {
        debug(`new best block: ${b2h(tockhash)} (new work: ${b2h(this_work)}, old work: ${b2h(best_work)})`)
        rite.etch(rkey('best'), tockhash)
    }
}

function subsidyleft(rite :Rite, _time :Blob) :Bnum {
    let time = bnum(_time)
    if (time == BigInt(0)) {
        let res = rite.read(rkey('left', n2b(BigInt(0))))
        need(!bleq(t2b(''), res), 'left not found at block 0')
        return bnum(res)
    }
    need(time % BigInt(57) == BigInt(0), 'subsidyleft time must be multiple of 57')
    let _left = rite.read(rkey('left', n2b(time - BigInt(57))))
    need(!bleq(t2b(''), _left), `time has no left ${b2h(_time)}`)
    let left = bnum(_left)
    let nextleft = left - left / (BigInt(2) ** BigInt(21))
    rite.etch(rkey('left', n2b(time)), n2b(nextleft))
    return nextleft
}

// vult_thin grows possibly-valid state tree
//   (could also invalidate tock)
function vult_thin(tree :Tree, tock :Tock, updatebest :boolean =true) :MemoAskTocks {
    // aver prev tock must exist
    // aver well/vinx
    let [prev_head,, time,] = tock
    let head = mash(roll(tock))
    debug('vult_thin', b2h(head), rmap(tock, b2h))
    let prev_foldandidx = tree.rock.find_max(rkey('fold', prev_head))
    if (!bleq(t2b(''), tree.rock.read_one(rkey('fold', head, h2b('00'))))) {
        prev_foldandidx = tree.rock.find_max(rkey('fold', head))
    }
    let [prev_fold,] = prev_foldandidx
    aver(_ => !bleq(t2b(''), prev_fold), `prev fold must exist`)

    let [prev_snap, ,] = unroll(prev_fold)
    let out
    tree.grow(prev_snap as Snap, (rite, twig, snap) => {
        let prev_tock = unroll(rite.read(rkey('tock', prev_head)))
        aver(_ => prev_tock.length > 0, `vulting a tock with unrecognized prev`)
        let prev_work = rite.read(rkey('work', prev_head))
        let this_work = n2b(bnum(prev_work) + tuff(head))

        aver(_ => {
            let prevknow = b2t(twig.read(rkey('know', prev_head)))
            return 'PV' == prevknow || 'DV' == prevknow
        }, `panic, say/tocks prev must be PV (${b2h(prev_head)})`)

        let tockknow = b2t(twig.read(rkey('know', head)))
        if ('PV' == tockknow || 'DV' == tockknow) {
            out = [MemoType.AskTocks, head]
            return
        }

        rite.etch(rkey('tock', head), roll(tock))
        rite.etch(rkey('work', head), this_work)
        rite.etch(rkey('fold', head, h2b('00')), roll([snap, h2b('00')])) // [snap, fees]
        twig.etch(rkey('know', head), t2b('PV'))
        twig.etch(rkey('pyre', head), n2b(bnum(time) + BigInt(536112000)))
        let left = subsidyleft(rite, time)
        let nextleft = subsidyleft(rite, n2b(bnum(time) + BigInt(57)))
        debug(`vult_thin etching ment at head=${b2h(head)}, ${left - nextleft}`)
        twig.etch(rkey('ment', head, h2b('07')), roll([head, n2b(left - nextleft)])) // [code, cash]
        let pyre = bnum(time) + BigInt(536112000)
        twig.etch(rkey('pyre', head), n2b(pyre))
        if (updatebest) {
            etch_best(rite, head)
        }
        out = [MemoType.AskTocks, head]
    })

    debug('vult_thin: grew', b2h(head), 'to PV')
    return [MemoType.AskTocks, head]
}

// vult_full grows definitely-valid state tree
//   (could also invalidate tock)
function vult_full(tree :Tree, tock :Tock) :MemoAskTacks|MemoAskTocks|MemoAskTicks|MemoErr { // :Memo
    debug(`vult_full ${rmap(tock, b2h)}`)

    let [prevtockhash, root, time, fuzz] = tock
    let tockhash = mash(roll(tock))
    if (bnum(time) == BigInt(0)) {
        return [MemoType.AskTocks, tockhash]
    }

    aver(
        () => !bleq(t2b(''), tree.rock.read_one(rkey('tock', mash(roll(tock))))),
        'tock not found in rock'
    )

    let _prevtock = tree.rock.read_one(rkey('tock', prevtockhash))
    need(!bleq(t2b(''), _prevtock), `vult_full prev tock not found ${b2h(prevtockhash)})`)
    let prevmemo = vult_full(tree, unroll(_prevtock) as Tock)
    let expectedprevmemo = memo_close([MemoType.AskTocks, prevtockhash])
    if (!bleq(roll(expectedprevmemo), roll(memo_close(prevmemo)))) {
        debug(`vult_full prev incomplete, returning prev memo`)
        return prevmemo
    }

    vult_thin(tree, tock, false)

    let prevtack = unroll(tree.rock.read_one(rkey('tack', prevtockhash)))

    let fold = tree.rock.read_one(rkey('fold', tockhash, n2b(BigInt(0))))
    let foldandidx = tree.rock.find_max(rkey('fold', tockhash))
    let foldidx = foldandidx[1]
    let [prev_snap, _prev_fees] = unroll(foldandidx[0]) as [Snap, Blob]
    let prev_fees = bnum(_prev_fees)

    let valid = true
    let cur_snap
    // todo do this per tack...init fees can be nonzero then
    let fees = BigInt(0)
    let err
    let out
    tree.grow(prev_snap as Snap, (rite, twig, snap) => {
        try {
            let prevknow = b2t(twig.read(rkey('know', prevtockhash)))
            need('DV' == prevknow, `prevtock must be DV (${b2h(prevtockhash)} is ${prevknow})`)

            cur_snap = snap
            aver(
                _ => !bleq(t2b(''), rite.read(rkey('tock', tockhash))),
                'vult_full: tock not found'
            )

            let tockknow = b2t(twig.read(rkey('know', tockhash)))
            if ('DV' == tockknow) {
                debug(`vult_full block is already DV, sending ask/tocks`, b2h(tockhash))
                out = [MemoType.AskTocks, tockhash]
                return
            }


            let firsttack_blob = rite.read(rkey('tack', tockhash, h2b('00')))
            if (bleq(firsttack_blob, t2b(''))) {
                debug('first tack not found, asking tacks')
                out = [MemoType.AskTacks, tockhash]
                return
            }
            let [head, , ribs, feet] = unroll(firsttack_blob) as Tack
            // ribs.length == 0 if tack has fewer than 512 feet
            let hop = Math.ceil(feet.length / 1024)
            for (let eye = hop; eye < ribs.length; hop = Math.ceil(feet.length / 1024), eye += hop) {
                let tack = rite.read(rkey('tack', tockhash, n2b(BigInt(eye))))
                if (bleq(tack, t2b(''))) {
                    debug("tack not found, asking tacks")
                    out = [MemoType.AskTacks, tockhash]
                    return
                }
                let feet = (unroll(tack) as Tack)[3]
                feet.push(...feet)
            }

            let leftfeet = []
            let ticks = feet.map(foot => {
                let tick = rite.read(rkey('tick', foot))
                if (bleq(tick, t2b(''))) {
                    leftfeet.push(foot)
                    return undefined
                }
                return unroll(tick) as Tick
            })

            if (leftfeet.length != 0) {
                debug('some feet not found, asking ticks')
                out = [MemoType.AskTicks, leftfeet]
                return
            }

            ticks.forEach(tick => {
                let tickhash = mash(roll(tick))
                let [moves, ments] = tick
                let tickfees = BigInt(0)
                moves.forEach(move => {
                    // input must not be spent or expired
                    let [txin, idx, sign] = move
                    let ment = twig.read(rkey('ment', txin, idx))
                    need(!bleq(ment, t2b('')), `ment must exist txin=${b2h(txin)} idx=${b2h(idx)}`)
                    need(bleq(twig.read(rkey('pent', txin, idx)), t2b('')), 'move must be unspent')
                    let pyre = twig.read(rkey('pyre', txin)) // todo ok?
                    need(!bleq(pyre, t2b('')), 'txin has no pyre')
                    need(bnum(time) < bnum(pyre), `txin can't be expired`)
                    let [code, cash] = unroll(ment) as [Code, Cash]
                    twig.etch(rkey('pent', txin, idx), h2b('ff'))
                    debug(`cash=${b2h(cash)} txin=${b2h(txin)}`)
                    tickfees += bnum(cash)
                    if (bleq(idx, h2b('07')) && bleq(txin, prevtockhash)) {
                        // the mint always consumes all fees
                        debug(`MINT move, input cash = ${b2h(cash)}`)
                        tickfees += fees
                        fees = BigInt(0)
                    }
                })
                ments.forEach((ment, idx) => {
                    twig.etch(rkey('ment', tickhash, n2b(BigInt(idx))), roll(ment))
                    let [code, cash] = ment
                    tickfees -= bnum(cash)
                })
                fees += tickfees
                let pyre = bnum(time) + BigInt(536112000)
                twig.etch(rkey('pyre', tickhash), n2b(pyre))
            })
            need(fees == BigInt(0), `total block fees must equal 0 (fees=${fees}) block=${b2h(tockhash)}`)
            debug('vult_full SUCCESS, setting DV', b2h(tockhash))
            twig.etch(rkey('know', tockhash), t2b('DV'))
            valid = true
            out = [MemoType.AskTocks, tockhash]
            etch_best(rite, tockhash)
        } catch (e) {
            valid = false
            err = e
            twig.etch(rkey('know', tockhash), t2b('DN'))
            out = [MemoType.Err, ['unspendable', tock]]
            debug("vult_full invalid", b2h(tockhash), err.message)
        }
    })

    tree.rock.etch_one(rkey('fold', tockhash, n2b(foldidx + BigInt(1))), roll([cur_snap, n2b(prev_fees + fees)]))
    return out
}
