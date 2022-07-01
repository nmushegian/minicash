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
    scry, sign
} from './word.js'

import elliptic from 'elliptic'
import {rkey, Tree} from "./tree.js";
import {know, latest_fold} from "./vult.js";
import {vinx_tack, vinx_tick, vinx_tock} from "./vinx.js";
import {form_tack, form_tick, form_tock} from "./well.js";

const ec = elliptic.ec('secp256k1')
type EzSend = [string, bigint, string, bigint]
type EzTick = EzSend[] //from, to, amt

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

    make(eztick :EzTick) :Tick {
        need(eztick.length <= 7, 'too many moves in this tick')
        let moves = []
        let ments = []
        eztick.forEach(ezsend => {
            let [from, index, to, amt] = ezsend

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

    signTick(tick :Tick, privkeys :string[]|string) {
        if (privkeys.toString() == privkeys) {
            privkeys = privkeys.repeat(tick.length)
        }

        let [_moves, ments] = tick
        need(_moves.length == privkeys.length, 'must have as many keys as moves')

        let moves = _moves.map((move, idx) => {
            let privkey = privkeys[idx]
            const mask = roll([
                t2b("minicash movement"),
                [ move ],
                ments
            ])

            let seck = h2b(privkey)
            let sig = sign(mask, seck)
            return [move[0], move[1], sig]
        })

        return [moves, ments]
    }

    makeSigned(ezTick :EzTick, privkeys:string[]|string) {
        let tick = this.make(ezTick)
        return this.signTick(tick, privkeys)
    }

    send(ezTick :EzTick, privkeys :string[]|string) {
        let tick = this.makeSigned(ezTick, privkeys) as Tick
        okay(form_tick(tick))
        let [moves, ments] = tick
        let tock
        let conx = moves
            .filter(move => {
                if (Number('0x' + b2h(move[1])) == 7) {
                    tock = unroll(this.tree.rock.read_one(rkey('tock', move[0]))) as Tock
                    return false
                }
                return true
            })
            .map(move => unroll(this.tree.rock.read_one(rkey('tick', move[0]))) as Tick)
        okay(vinx_tick([...conx, ...this.bowl], tick, tock))

        this.bowl.push(tick)
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
