import {Djin} from './djin.js'

import {Plug} from './plug.js'

export {Pool}
import {
    addr,
    b2h,
    bleq,
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
    unroll
} from './word.js'

import elliptic from 'elliptic'
import {rkey, Tree} from "./tree.js";
import {know, latest_fold} from "./vult.js";
import {vinx_tack, vinx_tick, vinx_tock} from "./vinx.js";
import {form_tack, form_tick, form_tock} from "./well.js";

const ec = elliptic.ec('secp256k1')

class Pool {
    djin :Djin
    plug :Plug
    guy  :Mash
    tree :Tree


    bowl :Tick[]           // mempool

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
    }

    send(tick :Tick) {

    }

    mine() {
        let besthash = this.djin.tree.rock.read_one(rkey('best'))
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

        let feet = [mash(roll(mint))]
        let prevtime = best[3]
        let time = extend(n2b(bnum(prevtime) + BigInt('0x39')), 7)
        // todo better fuzz
        let tock = [besthash, merk(feet), time, h2b('00'.repeat(7))] as Tock
        okay(form_tock(tock))
        okay(vinx_tock(best, tock))


        let tack = [tock, h2b('00'), [], feet] as Tack
        okay(form_tack(tack))
        okay(vinx_tack(tock, tack))

        let memo = memo_close([MemoType.SayTicks, [mint]])

        this.djin.turn(memo_close([MemoType.SayTocks, [tock]]))
        this.djin.turn(memo_close([MemoType.SayTacks, [tack]]))
        this.djin.turn(memo_close([MemoType.SayTicks, [mint]]))
        console.log(`mined a block! ${b2h(mash(roll(tock)))}`)
    }

    pool() {
        this.plug.when((memo, back) => {
            // ask/jobs
            //   let job = [best.tock, fill.length]
            // say/work
            //   update best
            // say/ticks ticks
            //   this.snap = this.djin.tree.grow_twig(this.snap, twig => {
            //      deque tick from bowl
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
