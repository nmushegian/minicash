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
    unroll, Know
} from './word.js'

import {rkey, Tree, Twig} from './tree.js'
import {Blob} from "coreword";
import {Rite} from "./rock";

const debug = Debug('vult::test')

export {
    vult_thin,
    vult_full
}

// update best tock if input tock has more work
// than current best
function etch_best(rite, tockhash :Blob) {
    let curwork = rite.read(rkey('work', tockhash))
    let best = rite.read(rkey('best'))
    let bestwork = rite.read(rkey('work', best))
    if (bnum(curwork) > bnum(bestwork)) {
        debug(`new best block: ${b2h(tockhash)} (new work: ${b2h(curwork)}, old work: ${b2h(bestwork)})`)
        rite.etch(rkey('best'), tockhash)
    }
}

// calculate remaining block subsidy at time, cache the result
// this function is only called by vult_full and vult_thin when
// the previous tock has already been vulted, so prev should always
// be cached
//
// left[0] = 2 ** 53 - 1 (set in djin)
// left[time] = left[time-57] - floor(left[time-57] / (2 ** 21))
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

// vult_thin grows possibly-valid state tree ('' | PV -> PV)
//   (could also invalidate tock)
function vult_thin(tree :Tree, tock :Tock) :MemoAskTocks {
    let [prevtockhash,, time,] = tock
    let tockhash = mash(roll(tock))
    debug('vult_thin', b2h(tockhash), rmap(tock, b2h))

    tree.rock.rite(rite => {
        aver(
            _ => !bleq(t2b(''), rite.read(rkey('tock', prevtockhash))),
            `vult_thining a tock with unrecognized prev`
        )
        aver(_ => {
            let prevknow = rite.read(rkey('know', prevtockhash))
            return 'PV' == prevknow || 'DV' == prevknow
        }, `panic, say/tocks prev must be PV (${b2h(prevtockhash)})`)

        let tockknow = b2t(rite.read(rkey('know', tockhash)))
        if ('PV' == tockknow || 'DV' == tockknow) {
            // tock has already been vult_thin'd
            return
        }

        // subsidy = nexttock.left - curtock.left
        let left = subsidyleft(rite, time)
        let nextleft = subsidyleft(rite, n2b(bnum(time) + BigInt(57)))
        debug(`vult_thin etching ment at head=${b2h(tockhash)}, ${left - nextleft}`)

        // current tock work = prev tock work + tuff(current tock)
        let prevwork = rite.read(rkey('work', prevtockhash))
        let curwork = n2b(bnum(prevwork) + tuff(tockhash))
        rite.etch(rkey('work', tockhash), curwork)

        // success, set this tock to PV and update best tockhash if more work
        rite.etch(rkey('know', tockhash), t2b('PV'))
        etch_best(rite, tockhash)
    })

    debug('vult_thin: grew', b2h(tockhash), 'to PV')
    return [MemoType.AskTocks, tockhash]
}

// vult_full grows definitely-valid state tree
//   (could also invalidate tock)
function vult_full(tree :Tree, tock :Tock) :MemoAskTacks|MemoAskTocks|MemoAskTicks|MemoErr { // :Memo
    let tockhash = mash(roll(tock))
    aver(
        () => !bleq(t2b(''), tree.rock.read_one(rkey('tock', tockhash))),
        'tock not found in rock'
    )
    aver(
        _ => !bleq(t2b(''), tree.rock.read_one(rkey('tock', tockhash))),
        'vult_full: tock not found'
    )

    debug(`vult_full ${rmap(tock, b2h)}`)
    let [prevtockhash, root, time, fuzz] = tock

    // treat bang block (time == 0) as already vulted
    if (bnum(time) == BigInt(0)) {
        return [MemoType.AskTocks, tockhash]
    }

    // don't need to do anything if this tock is arleady DV
    if ('DV' == b2t(tree.rock.read_one(rkey('know', tockhash)))) {
        debug(`vult_full block is already DV, sending ask/tocks`, b2h(tockhash))
        return [MemoType.AskTocks, tockhash]
    }

    // vult the previous tock (PV | DV) -> DV
    // todo maybe good to do in a loop...
    let prevtock = unroll(tree.rock.read_one(rkey('tock', prevtockhash))) as Tock
    let outprev = vult_full(tree, prevtock)
    let goodoutprev = memo_close([MemoType.AskTocks, prevtockhash])
    // this check is same as checking prev.know == DV
    if (!bleq(roll(goodoutprev), roll(memo_close(outprev)))) {
        debug(`vult_full prev incomplete, returning prev memo`)
        return outprev
    }

    // get tip of state tree
    // this part needs to come before the grow block because of prevsnap,
    // and stuff before it potentially grows the state tree, so it must also
    let foldandidx = tree.rock.find_max(rkey('fold', tockhash))
    if (undefined == foldandidx) {
        // if this is the first time vulting this tock, prev fold
        // comes from prev tockhash
        foldandidx = tree.rock.find_max(rkey('fold', prevtockhash))
    }
    aver(() => undefined != foldandidx, `fold must exist (1)`)
    let [fold, foldidx] = foldandidx
    aver(() => !bleq(t2b(''), fold), `fold must exist (2)`)
    let [prevsnap, _prevfees] = unroll(fold) as [Snap, Blob]
    let prevfees = bnum(_prevfees)

    let cursnap // for setting new state tip
    // todo do this per tack...init fees can be nonzero then
    let tockfees = BigInt(0)
    let out
    tree.grow(prevsnap as Snap, (rite, twig, snap) => {
        if (bleq(t2b(''), rite.read(rkey('work', tockhash)))) {
            // vult current tock ('' | 'PV') -> 'PV'
            aver(
                _ => !bleq(t2b(''), rite.read(rkey('tock', prevtockhash))),
                `vulting a tock with unrecognized prev`
            )
            aver(_ => {
                let prevknow = b2t(rite.read(rkey('know', prevtockhash)))
                return 'DV' == prevknow
            }, `panic, say/tocks prev must be DV (${b2h(prevtockhash)})`)

            // vult_full_rock can read the state tree from any foldidx,
            // but will only ever grow the state tree to foldidx == 0
            // (bails if current tock PV)
            rite.etch(
                rkey('fold', tockhash, h2b('00')),
                roll([snap, h2b('00')])
            ) // [snap, fees]

            // current tock work = prev tock work + tuff(current tock)
            let prevwork = rite.read(rkey('work', prevtockhash))
            let curwork = n2b(bnum(prevwork) + tuff(tockhash))
            rite.etch(rkey('work', tockhash), curwork)

            debug('vult_full_rock: grew', b2h(tockhash), 'to PV')
        }

        cursnap = snap

        // should already have vulted prev to DV
        let prevknow = b2t(rite.read(rkey('know', prevtockhash)))
        aver(
            () => 'DV' == prevknow,
            `prevtock must be DV (${b2h(prevtockhash)} is ${prevknow})`
        )

        try {

            // check that all tacks are in the db, return AskTacks if not
            // should have already been well'd and vinx'd
            let eye = 0
            let ribs
            let feet = []
            do {
                let _tack = rite.read(rkey('tack', tockhash, n2b(BigInt(eye))))
                if (bleq(_tack, t2b(''))) {
                    debug("tack not found, asking tacks")
                    out = [MemoType.AskTacks, tockhash]
                    return
                }

                // one chunk is 1024 feet
                // next eye = cur eye + num_chunks
                let tack = unroll(_tack) as Tack
                let chunks
                [, , ribs, chunks] = tack
                feet.push(...chunks)
                let nchunks = Math.ceil(chunks.length / 1024)
                eye += nchunks
            } while (eye < ribs.length)


            // check that all ticks are in the db, return AskTicks if not
            let leftfeet = []
            let _ticks = feet.map(foot => {
                let _tick = rite.read(rkey('tick', foot))
                if (bleq(_tick, t2b(''))) {
                    leftfeet.push(foot) // foot not found, will AskTicks
                    return undefined
                }
                return _tick
            })

            if (leftfeet.length != 0) {
                debug('some feet not found, asking ticks')
                out = [MemoType.AskTicks, leftfeet]
                return
            }

            // have all tocks/tacks/ticks
            // this block checks for double spends (pent),
            // moves with expired txin, (pyre)
            // unspent/overspent fees (tockfees) (todo no negative tickfees),
            // todo no future tocks allowed,
            let ticks = _ticks.filter(tick => tick != undefined).map(unroll) as Tick[]
            let ismint = false
            ticks.forEach((tick, tickidx) => {
                let tickhash = mash(roll(tick))
                let [moves, ments] = tick
                // check moves for double spends, expired txin
                // add moved amount to tockfees
                moves.forEach(move => {
                    // fail if input is spent or expired
                    let [txin, idx, sign] = move
                    ismint = bleq(idx, h2b('07'))
                    if (ismint) {
                        let prevleft = subsidyleft(rite, n2b(bnum(time) - BigInt(57)))
                        let left = subsidyleft(rite, time)
                        tockfees += prevleft - left
                        return
                    }

                    let ment = twig.read(rkey('ment', txin, idx))
                    need(
                        !bleq(ment, t2b('')),
                        `ment must exist in state tree txin=${b2h(txin)} idx=${b2h(idx)}`
                    )
                    need(
                        bleq(twig.read(rkey('pent', txin, idx)), t2b('')),
                        'move must be unspent'
                    )

                    let pyre = twig.read(rkey('pyre', txin)) // todo ok?
                    need(bnum(time) < bnum(pyre), `txin can't be expired`)

                    // set this ment as spent so future moves can't spend
                    let [,cash] = unroll(ment) as [Code, Cash]
                    twig.etch(rkey('pent', txin, idx), h2b('ff'))
                    debug(`cash=${b2h(cash)} txin=${b2h(txin)}`)

                    // fees are calculated per-tick, not per-move
                    tockfees += bnum(cash)
                })

                // put ments in state tree
                // subtract output amount from tockfees
                // what remains after goes to miner
                ments.forEach((ment, idx) => {
                    twig.etch(rkey('ment', tickhash, n2b(BigInt(idx))), roll(ment))
                    let [code, cash] = ment
                    tockfees -= bnum(cash)
                })

                let pyre = bnum(time) + BigInt(536112000)
                twig.etch(rkey('pyre', tickhash), n2b(pyre))
            })

            // the mint tick is last and must consume all fees
            // -> mint tick's total cash == fees + prev tock's ment's cash
            need(ismint, `last tick must be mint tickslen: ${ticks.length}`)
            need(
                BigInt(0) == tockfees,
                `tock fees must equal 0 (tockfees=${tockfees})`
            )

            debug('vult_full SUCCESS, setting DV', b2h(tockhash))
            rite.etch(rkey('know', tockhash), t2b('DV'))
            // update best tock if this tock has more work
            etch_best(rite, tockhash)
            // ask for next tocks
            out = [MemoType.AskTocks, tockhash]
        } catch (e) {
            rite.etch(rkey('know', tockhash), t2b('DN'))
            out = [MemoType.Err, ['unspendable', tock]]
            debug("vult_full invalid", b2h(tockhash), e.message)
        }
    })

    // save the current snap to db so future vults can build state from it
    let curfold = [cursnap, n2b(prevfees + tockfees)]
    let curfoldidx = n2b(foldidx + BigInt(1))
    tree.rock.etch_one(rkey('fold', tockhash, curfoldidx), roll(curfold))
    return out
}
