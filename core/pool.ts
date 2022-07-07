import {Djin} from './djin.js'

import {Plug} from './plug.js'

export {Pool}
import {
    addr,
    b2h,
    bleq, Bnum,
    bnum, extend,
    h2b,
    Hexs,
    Mash,
    mash,
    memo_close,
    MemoType,
    merk,
    n2b,
    need, okay,
    roll,
    Snap,
    t2b,
    Tack,
    Tick,
    Tock, toss,
    unroll,
    scry, sign, rmap, Fees,
    Blob, Code, Cash, memo_open
} from './word.js'

import elliptic from 'elliptic'
import {rkey, Tree} from "./tree.js";
import {know, latest_fold} from "./vult.js";
import {vinx_tack, vinx_tick, vinx_tock} from "./vinx.js";
import {form_tack, form_tick, form_tock} from "./well.js";

const ec = elliptic.ec('secp256k1')
type EzSend = [string, bigint, string, bigint]
type EzTick = EzSend[] //from, to, amt

import Debug from 'debug'
const debug = Debug('pool::test')

class Pool {
    djin :Djin
    plug :Plug
    guy  :Mash
    tree :Tree


    cands :Tick[]           // mempool

    // each of these should be in per-candidate map, aka use a pure Tree
    sink :Tick[]           // tock template
    sunk :{string:boolean} // ticks in this sink back index
    root :Mash   // active merk root
    snap :Snap   // active UTXO set handle

    best : Mash   // best pow for this cycle
    roots :Map<Hexs,[Snap,number]>   // root -> [snap, fill.idx]  reverse index
    fees : Map<Hexs, Bnum>

    constructor(djin, plug, pubkey :Hexs) {
        this.djin = djin
        this.plug = plug
        this.guy  = addr(h2b(pubkey))
        this.tree = this.djin.tree
        this.cands = []
        this.best = this.tree.rock.read_one(rkey('best'))
        this.fees = new Map<Hexs, Bnum>()
    }

    mine(minetime :Number =0) :string {
        try {
            let besthash = this.djin.tree.rock.read_one(rkey('best'))
            debug(`mine best=${b2h(besthash)}, cands length=${this.cands.length}`)
            let bestroll = this.djin.tree.rock.read_one(rkey('tock', besthash))
            need(!bleq(t2b(''), bestroll), `best tock not found`)
            let mintmoves = [[besthash, h2b('07'), h2b('00'.repeat(65))]]
            let [fold, foldidx] = latest_fold(this.djin.tree, besthash)
            let [snap, _fees] = unroll(fold) as [Snap, Blob]


            //let oldcands = this.cands
            //this.cands = []
            //oldcands.forEach(c => this.addpool(c))
            let ticks = this.cands
            let fees = bnum(_fees)
            need(fees == BigInt(0), `best fees must equal 0`)

            // mintcash = previous tockhash's ment plus this tock's fees
            let cash
            this.djin.tree.look(snap as Snap, (rock, twig) => {
                let bestment = twig.read(rkey('ment', besthash, h2b('07')))
                ;[, cash] = unroll(bestment)
            })
            need(cash != undefined, 'cash not found')
            let cashandfees = bnum(cash)
            ticks.forEach(tick => {
                cashandfees += this.fees[b2h(mash(roll(tick)))]
            })
            let mintments = [[this.guy, extend(n2b(cashandfees), 7)]]
            let mint = [mintmoves, mintments] as Tick
            okay(form_tick(mint))
            let best = unroll(bestroll) as Tock
            okay(vinx_tick([], mint, best))
            ticks.push(mint)
            debug('created mint')

            let prevtime = best[2]
            let time = extend(n2b(bnum(prevtime) + BigInt('0x39')), 7)
            // todo better fuzz
            let feet = ticks.map(t => mash(roll(t)))
            let tock = [besthash, undefined, time, h2b('00'.repeat(7))] as Tock

            let ribs = []
            let feetslices = []
            if (feet.length < 512) {
                tock[1] = merk(feet)
                feetslices = [feet]
            } else {
                for (let i = 0; i < feet.length; i += 1024) {
                    let start = i
                    let end = i + 1024
                    let feetslice = feet.slice(start, end)
                    let rib = merk(feetslice)
                    ribs.push(rib)
                    feetslices.push(feetslice)
                }
                tock[1] = merk(ribs)
            }

            let starttime = performance.now()
            let nonce = BigInt(1)
            while (performance.now() - starttime < minetime) {
                let [prev, root, time, fuzz] = tock
                let curtockhash = mash(roll(tock))
                let nexttock = [prev, root, time, extend(n2b(nonce++), 7)] as Tock
                let nexttockhash = mash(roll(nexttock))
                if (bnum(nexttockhash) < bnum(curtockhash)) {
                    tock = nexttock
                }
            }

            debug(`mining with ${ribs.length} ribs`)
            okay(form_tock(tock))
            okay(vinx_tock(best, tock))

            let tacks = feetslices.map((feetslice, idx) => {
                let tack = [tock, n2b(BigInt(idx)), ribs, feetslice] as Tack
                okay(form_tack(tack))
                okay(vinx_tack(tock, tack))
                return tack
            })

            let memo = memo_close([MemoType.SayTicks, [mint]])

            let out
            ticks.forEach(tick => {
                out = okay(this.djin.turn(memo_close([MemoType.SayTicks, [tick]])))
                need(MemoType.Err != memo_open(out)[0], `mine: say/ticks failed ${rmap(out, b2h)}`)
            })
            tacks.forEach(tack => {
                out = okay(this.djin.turn(memo_close([MemoType.SayTacks, [tack]])))
                need(MemoType.Err != memo_open(out)[0], `mine: say/tacks failed ${rmap(out, b2h)}`)
            })
            out = okay(this.djin.turn(memo_close([MemoType.SayTocks, [tock]])))
            need(MemoType.Err != memo_open(out)[0], `mine: say/tocks failed ${rmap(out, b2h)}`)
            debug(`mined a block! hash=${b2h(mash(roll(tock)))} block=${rmap(tock, b2h)} numtx=${feet.length}`)
            debug(`best=${b2h(this.tree.rock.read_one(rkey('best')))}`)
            this.cands = []
            return b2h(mash(roll(tock)))
        } catch (e) {
            this.cands = []
            toss('mine error', e)
        }
    }

    make(eztick :EzTick) :Tick {
        need(eztick.length <= 7, 'too many moves in this tick')
        let moves = []
        let ments = []
        eztick.forEach(ezsend => {
            let [from, index, to, amt] = ezsend
            if (from == 'best') {
                let besthash = this.tree.rock.read_one(rkey('best'))
                from = b2h(besthash)
            }

            let txin = h2b(from)
            let idx  = n2b(index)
            let code = addr(h2b(to))
            let cash = extend(n2b(amt), 7)
            let sign = t2b('')
            moves.push([txin, idx, sign])
            ments.push([code, cash])
        })

        return [moves, ments]
    }

    signTick(tick :Tick, privkey :string[]|string) {
        let [_moves, ments] = tick
        need(typeof privkey == 'string' || _moves.length == privkey.length, 'must have as many keys as moves')


        let moves = _moves.map((move, idx) => {
            let pk = privkey
            if (typeof privkey != 'string') {
                pk = privkey[idx]
            }
            const mask = roll([
                t2b("minicash movement"),
                [ move ],
                ments
            ])

            let seck = h2b(pk as string)
            let sig = sign(mask, seck)
            return [move[0], move[1], sig]
        })
        okay(form_tick([moves, ments]))

        return [moves, ments]
    }

    makeSigned(ezTick :EzTick, privkeys:string[]|string) {
        let tick = this.make(ezTick)
        return this.signTick(tick, privkeys)
    }

    addpool(tick :Tick) {
        //debug('addpool', mash(roll(tick)))
        okay(form_tick(tick))
        let [moves, ments] = tick
        let tock
        let conx = moves.map(move => {
            let _tock = this.tree.rock.read_one(rkey('tock', move[0]))
            if (!bleq(t2b(''), _tock)) {
                tock = unroll(_tock)
            }
            return unroll(this.tree.rock.read_one(rkey('tick', move[0]))) as Tick
        })
        okay(vinx_tick([...conx, ...this.cands], tick, tock))

        let besthash = this.tree.rock.read_one(rkey('best'))
        let [snapfees, snapidx] = latest_fold(this.tree, besthash)
        let [snap, ] = unroll(snapfees)
        this.tree.look(snap as Snap, (rock, twig) => {
            // check no pents in current snap
            moves.forEach(move => {
                let [txin, idx, sign] = move
                let pent = twig.read(rkey('pent', txin, idx))
                need(bleq(t2b(''), pent), `ment already pent ${b2h(txin)} idx=${b2h(idx)}`)
            })
        })

        // check no pents in cands
        moves.forEach(move => {
            let [txin, idx, ] = move
            this.cands.forEach(cand => {
                let [candmoves, candments] = cand
                candmoves.forEach(candmove => {
                    let [candtxin, candidx,] = candmove
                    need(
                        !(bleq(txin, candtxin) && bleq(idx, candidx)),
                        `conflicting tick found in pool existing=${rmap(cand, b2h)} new=${rmap(tick, b2h)}`
                    )
                })
            })
        })

        this.tree.look(snap as Snap, (rock, twig) => {
            // calculate this tock's fees
            let fees = BigInt(0)
            moves.forEach(move => {
                let [txin, idx, sign] = move
                let _prevment = twig.read(rkey('ment', txin, idx))
                let prevment
                if (bleq(t2b(''), _prevment)) {
                    let prevtick = this.cands.find(t => bleq(mash(roll(t)), txin))
                    need(undefined != prevtick, `addpool couldn't find prev ment ${b2h(txin)} ${b2h(idx)} ${this.cands.length}`)
                    let [, prevments] = prevtick
                    need(BigInt(prevments.length) > bnum(idx), 'addpool prev ment not found (1)')
                    prevment = prevments[Number(bnum(idx))]
                } else {
                    prevment = unroll(_prevment)
                }
                let [code, cash] = prevment
                fees += bnum(cash)
            })
            ments.forEach(ment => {
                let [code, cash] = ment
                fees -= bnum(cash)
            })
            need(fees >= BigInt(0), `addpool tick fees must be >= 0`)
            this.fees[b2h(mash(roll(tick)))] = fees
        })

        this.cands.push(tick)
        //debug(`pushing tick ${b2h(mash(roll(tick)))}`)
        return b2h(mash(roll(tick)))
    }



    send(ezTick :EzTick, privkeys :string[]|string) :string {
        let tick = this.makeSigned(ezTick, privkeys) as Tick
        this.add(tick)
        return b2h(mash(roll(tick)))
    }


    add(tick :Tick) {
        let [moves, ments] = tick
        moves.forEach(move => {
            need(Number('0x' + b2h(move[1])) != 7, 'only miner can mint')
        })
        this.addpool(tick)
    }

    pool() {
        this.plug.when((memo, back) => {
            // ask/jobs
            //   let job = [best.tock, fill.length]
            // say/work
            //   update best
            // say/ticks ticks
            //   this.snap = this.djin.tree.grow_twig(this.snap, twig => {
            //      deque tick from cands
            //      let ok = vult_tick(twig, tick)
            //      if (ok)
            //         this.sink.push(tick)
            //   })
            //   root = remerk(this.sink)
            //   roots[root] = this.snap
            // say/tock tock
            //   this.djin.turn(tock)
        })
    }

}
