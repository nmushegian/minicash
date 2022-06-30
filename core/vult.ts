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
    MemoSayTicks,
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

const debug = Debug('vult::test')

export {
    vult_thin,
    vult_full,
    latest_fold,
    know,
    vult_tack,
    vult_tick

}

function latest_fold(tree :Tree, tockhash :Blob) :[Blob, Bnum]{
    let i = BigInt(0)
    let prev_tail
    while (true) {
        let tail = tree.rock.read_one(rkey('fold', tockhash, n2b(i)))
        if (bleq(tail, t2b(''))) {
            break
        }
        i++
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
        res = twig.read(rkey('know', tockhash))
    })
    return b2t(res)
}

function vult_best(tree :Tree, tockhash :Blob) {
    let this_work = tree.rock.read_one(rkey('work', tockhash))
    let best = tree.rock.read_one(rkey('best'))
    let best_work = tree.rock.read_one(rkey('work', best))
    if (bnum(this_work) > bnum(best_work)) {
        debug(`new best block: ${b2h(tockhash)} (new work: ${b2h(this_work)}, old work: ${b2h(best_work)})`)
        tree.rock.etch_one(rkey('best'), tockhash)
    }
}

function subsidy(time :Bnum) :Bnum {
    return BigInt('0xff00000000')
}

// vult_thin grows possibly-valid state tree
//   (could also invalidate tock)
function vult_thin(tree :Tree, tock :Tock, updatebest :boolean =true) :MemoAskTocks|MemoErr {
    // aver prev tock must exist
    // aver well/vinx
    let [prev, root, time, fuzz] = tock
    let head = mash(roll(tock))
    if (!bleq(t2b(''), tree.rock.read_one(rkey('tock', head)))) {
        let tockknow = know(tree, head)
        if ('PV' == tockknow || 'DV' == tockknow) {
            return [MemoType.AskTocks, head]
        }
    }
    let prev_head = tock[0]
    let prev_tock = unroll(tree.rock.read_one(rkey('tock', prev_head)))
    aver(_ => prev_tock.length > 0, `vulting a tock with unrecognized prev`)
    let prev_work = tree.rock.read_one(rkey('work', prev_head))
    let this_work = n2b(bnum(prev_work) + tuff(head))
    debug('vult_thin', b2h(head), 'work=', b2h(this_work))
    let prev_foldandidx = latest_fold(tree, prev_head)
    let [prev_fold,] = prev_foldandidx
    //let prev_fold = tree.rock.read_one(rkey('fold', prev_head, n2b(BigInt(0))))
    aver(_ => prev_fold.length > 0, `prev fold must exist`)
    let [prev_snap, ,] = unroll(prev_fold)
    tree.grow(prev_snap as Snap, (rite, twig, snap) => {
        rite.etch(rkey('tock', head), roll(tock))
        rite.etch(rkey('work', head), this_work)
        rite.etch(rkey('fold', head, h2b('00')), roll([snap, h2b('00')])) // [snap, fees]
        twig.etch(rkey('know', head), t2b('PV'))
        twig.etch(rkey('pyre', head), n2b(bnum(time) + BigInt(536112000)))
        twig.etch(rkey('ment', head, h2b('07')), roll([head, n2b(subsidy(bnum(time)))])) // [code, cash]
        let pyre = bnum(time) + BigInt(536112000)
        twig.etch(rkey('pyre', head), n2b(pyre))
    })
    if (updatebest) {
        vult_best(tree, head)
    }
    debug('vult_thin: grew', b2h(head), 'to PV')
    return [MemoType.AskTocks, head]
}


function vult_tick(tree :Tree, tick :Tick) :MemoSayTicks|MemoErr{
    debug(`vult_tick ${rmap(tick, b2h)} hash=${b2h(mash(roll(tick)))}`)
    const tickhash = mash(roll(tick))
    const key = rkey('tick', tickhash)
    const memo = [MemoType.SayTicks, [tick]] as MemoSayTicks
    if (bleq(tree.rock.read_one(key), h2b(''))) {
        tree.rock.etch_one(rkey('tick', tickhash), roll(tick))
        return memo
    }

    return [MemoType.Err, ['invalid', memo_close(memo)]]
}

function vult_tack(tree :Tree, tack :Tack, full=false) :MemoAskTocks|MemoAskTacks|MemoAskTicks|MemoErr {
    let [head, eye, ribs, feet] = tack
    let headhash = mash(roll(head))
    let prev = head[0]
    let prevhash = mash(roll(prev))
    tree.rock.etch_one(rkey('tack', headhash, eye), roll(tack))

    let tockroll = tree.rock.read_one(rkey('tock', headhash))
    if (bleq(t2b(''), tockroll)) {
        debug('vult_tack tock not found, sending ask/tocks')
        return [MemoType.AskTocks, prevhash]
    }

    if (full) {
        return vult_full(tree, head)
    }

    if (bleq(t2b(''), tockroll)) {
        return vult_thin(tree, head, !full)
    }

    return [MemoType.AskTocks, headhash]
}


// vult_full grows definitely-valid state tree
//   (could also invalidate tock)
function vult_full(tree :Tree, tock :Tock) :MemoAskTacks|MemoAskTocks|MemoAskTicks|MemoErr { // :Memo
    let [prevtockhash, root, time, fuzz] = tock
    let prevtack = unroll(tree.rock.read_one(rkey('tack', prevtockhash)))
    let tockhash = mash(roll(tock))
    debug('vult_full', b2h(tockhash))

    if (!bleq(t2b(''), tree.rock.read_one(rkey('tock', tockhash)))) {
        let tockknow = know(tree, tockhash)
        debug("KNOW=", tockknow)

        if ('DV' == tockknow) {
            debug(`vult_full block is already DV, sending ask/tocks`, b2h(tockhash))
            return [MemoType.AskTocks, tockhash]
        }
    }

    if ('PV' == know(tree, prevtockhash)) {
        // todo need to do this in a loop
        debug('vult_full last tock is PV, trying to vult it')
        let prevtock = unroll(tree.rock.read_one(rkey('tock', prevtockhash))) as Tock
        let prevmemo = vult_full(tree, prevtock)
        debug('vult_full successfully vulted prev=', b2h(prevtockhash), prevmemo)
        if (!(MemoType.AskTocks == prevmemo[0] && bleq(prevtockhash, prevmemo[1]))) {
            debug('vult_full sending prev tock vult result...', prevmemo, b2h(prevtockhash), b2h(tockhash))
            return prevmemo
        }
    }

    let thin = vult_thin(tree, tock, false)
    if (MemoType.Err == thin[0]) {
        return thin
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

    let leftfeet = []
    let ticks = feet.map(foot => {
        let tick = tree.rock.read_one(rkey('tick', foot))
        if (bleq(tick, t2b(''))) {
            leftfeet.push(foot)
            return undefined
        }
        return unroll(tick) as Tick
    })

    if (leftfeet.length != 0) {
        return [MemoType.AskTicks, leftfeet]
    }

    let fold = tree.rock.read_one(rkey('fold', tockhash, n2b(BigInt(0))))
    let foldandidx = latest_fold(tree, tockhash)
    let foldidx = foldandidx[1]
    let [prev_snap, _prev_fees] = unroll(latest_fold(tree, tockhash)[0]) as [Snap, Blob]
    let prev_fees = bnum(_prev_fees)

    let valid = false
    let cur_snap
    let fees = BigInt(0)
    let err
    tree.grow(prev_snap as Snap, (rite, twig, snap) => {
        try {
            let prevknow = b2t(twig.read(rkey('know', prevtockhash)))
            need('DV' == prevknow, `prevtock must be DV (${b2h(prevtockhash)} is ${prevknow})`)
            ticks.forEach(tick => {
                let tickhash = mash(roll(tick))
                let [moves, ments] = tick
                moves.forEach(move => {
                    let [txin, idx, sign] = move
                    let ment = twig.read(rkey('ment', txin, idx))
                    need(!bleq(ment, t2b('')), `ment must exist txin=${b2h(txin)} idx=${b2h(idx)}`)
                    need(bleq(twig.read(rkey('pent', txin, idx)), t2b('')), 'move must be unspent')
                    let pyre = twig.read(rkey('pyre', txin)) // todo ok?
                    need(!bleq(pyre, t2b('')), 'txin has no pyre')
                    need(bnum(time) < bnum(pyre), `txin can't be expired`)
                    let [code, cash] = unroll(ment) as [Code, Cash]
                    twig.etch(rkey('pent', txin, idx), h2b('ff'))
                    fees += bnum(cash)
                })
                ments.forEach((ment, idx) => {
                    twig.etch(rkey('ment', tickhash, n2b(BigInt(idx))), roll(ment))
                    let [code, cash] = ment
                    fees -= bnum(cash)
                })
                let pyre = bnum(time) + BigInt(536112000)
                twig.etch(rkey('pyre', tickhash), n2b(pyre))
            })
            need(fees >= BigInt(0), `fees can't be < 0 (fees=${fees}) block=${b2h(tockhash)}`)
            debug('vult_full SUCCESS, setting DV', b2h(tockhash))
            twig.etch(rkey('know', tockhash), t2b('DV'))
            cur_snap = snap
            valid = true
        } catch (e) {
            valid = false
            err = e
        }
    })

    if (!valid) {
        debug("vult_full invalid", b2h(tockhash), err.message)
        tree.rock.etch_one(rkey('know', tockhash), t2b('DN'))
        return [MemoType.Err, ['unspendable', tock]]
    }

    vult_best(tree, tockhash)

    tree.rock.etch_one(rkey('fold', tockhash, n2b(foldidx + BigInt(1))), roll([cur_snap, n2b(prev_fees + fees)]))
    return [MemoType.AskTocks, tockhash]
}
