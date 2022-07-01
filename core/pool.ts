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
    scry, sign, rmap
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

    best :Tock   // best pow for this cycle
    roots :Map<Hexs,[Snap,number]>   // root -> [snap, fill.idx]  reverse index

    constructor(djin, plug, pubkey :Hexs) {
        this.djin = djin
        this.plug = plug
        this.guy  = addr(h2b(pubkey))
        this.tree = this.djin.tree
        this.cands = []
    }

    mine() :string {
        let besthash = this.djin.tree.rock.read_one(rkey('best'))
        debug(`mine best=${b2h(besthash)}`)
        let bestroll = this.djin.tree.rock.read_one(rkey('tock', besthash))
        need(!bleq(t2b(''), bestroll), `best tock not found`)
        let moves = [[besthash, h2b('07'), h2b('00'.repeat(65))]]
        let [fold, foldidx] = latest_fold(this.djin.tree, besthash)
        let [snap, fees] = unroll(fold)
        let cash
        this.djin.tree.look(snap as Snap, (rock, twig) => {
            let bestment = twig.read(rkey('ment', besthash, h2b('07')))
            ;[,cash] = unroll(bestment)
        })
        need(cash != undefined, 'cash not found')
        let ments = [[this.guy, extend(cash, 7)]]
        let mint = [moves, ments] as Tick

        okay(form_tick(mint))
        let best = unroll(bestroll) as Tock
        okay(vinx_tick([], mint, best))

        let ticks = [mint]
        let used = {}
        // todo check double spends
        for (let [idx, cand] of this.cands.entries()) {
            if (ticks.length >= 512) {
                break
            }

            let [moves, ments] = cand
            let ok = true
            let used = {}
            for (let move of moves) {
                let [txin, idx,] = move
                if (used[b2h(txin) + b2h(idx)] != undefined) {
                    ok = false
                    break
                }
            }

            if (!ok) {
                break
            }

            ticks.push(cand)
            this.cands[idx] = undefined
        }
        this.cands = this.cands.filter(c => c != undefined)
        let prevtime = best[2]
        let time = extend(n2b(bnum(prevtime) + BigInt('0x39')), 7)
        // todo better fuzz
        let feet = ticks.map(t => mash(roll(t)))
        let tock = [besthash, merk(feet), time, h2b('00'.repeat(7))] as Tock
        okay(form_tock(tock))
        okay(vinx_tock(best, tock))

        let tack = [tock, h2b('00'), [], feet] as Tack
        okay(form_tack(tack))
        okay(vinx_tack(tock, tack))

        let memo = memo_close([MemoType.SayTicks, [mint]])

        ticks.forEach(t => this.djin.turn(memo_close([MemoType.SayTicks, [t]])))
        this.djin.turn(memo_close([MemoType.SayTacks, [tack]]))
        this.djin.turn(memo_close([MemoType.SayTocks, [tock]]))
        debug(`mined a block! hash=${b2h(mash(roll(tock)))} block=${rmap(tock, b2h)}`)
        return b2h(mash(roll(mint)))
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

    send(ezTick :EzTick, privkeys :string[]|string) :string {
        let tick = this.makeSigned(ezTick, privkeys) as Tick
        okay(form_tick(tick))
        let [moves, ments] = tick
        let tock
        let conx = moves.map(move => {
            need(Number('0x' + b2h(move[1])) != 7, 'only miner can mint')
            return unroll(this.tree.rock.read_one(rkey('tick', move[0]))) as Tick
        })
        okay(vinx_tick([...conx, ...this.cands], tick, tock))

        this.cands.push(tick)
        return b2h(mash(roll(tick)))
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
