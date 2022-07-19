// engine

import Debug from 'debug'
const dub = Debug('cash:djin')

import {
    Okay, pass, fail, toss, aver, need, err,
    b2h, h2b, n2b, b2t, t2b,
    Blob, bleq, blen, bnum, extend,
    roll, unroll, rmap, islist,
    Mash, mash, tuff,
    Tick, Tack, Tock,
    Memo, MemoType, MemoErr,
    MemoSayTicks, MemoSayTack, MemoSayTock,
    MemoAskTicks, MemoAskTack, MemoAskTock,
    OpenMemo, memo_open, memo_close,
} from './word.js'

import { form_memo, form_tock } from "./well.js";
import { vinx_tick, vinx_tack, vinx_tock} from "./vinx.js";
import { vult } from './vult.js'

import { Rock, rkey } from './rock.js'
import { Tree } from './tree.js'

export { Djin }

class Djin {
    rock :Rock   // content-addressed values
    tree :Tree   // per-tock view of state
    bang :Tock   // tock zero

    constructor(path :string, reset=false) {
        this.rock = new Rock(path, reset)
        this.tree = new Tree(this.rock, reset)
        this.bang = [
            h2b('00'.repeat(24)),
            h2b('00'.repeat(24)),
            h2b('00'.repeat(7)),
            h2b('00'.repeat(7)),
        ]
        let bangroll = roll(this.bang)
        let banghash = mash(bangroll)
        dub('banghash', banghash)
        this.tree.grow(h2b('00'.repeat(8)), (rite,twig,snap) => {
            rite.etch_best(banghash)
            rite.etch_tock(this.bang)
            rite.etch_work(banghash, tuff(bangroll))
            rite.etch_fold(banghash, 0, snap, 0)
            rite.etch_know(banghash, t2b('DV'))
            twig.etch_ment(banghash, h2b('07'),
                           h2b(''), n2b(BigInt(2) ** BigInt(53)), h2b(''))
        })
    }

    kill() {
        this.rock.shut()
    }

    async *spin(memos :Memo) {
        /*
          let out = turn(memo)
          yield
          let back = turn(out)
          yield
          if back is 'unavailable'
          return back
          else
          out = back
          continue
        */
    }

    turn(memo :Memo) :Memo {
        if (!form_memo(memo)[0]) {
            return memo_close([MemoType.Err, [t2b('invalid'), memo]])
        }

        let copy = memo_open(memo)
        let line = copy[0]

        if (MemoType.AskTock == line) {
            return memo_close(this._ask_tock(copy as MemoAskTock))
        }
        if (MemoType.AskTack == line) {
            return memo_close(this._ask_tack(copy as MemoAskTack))
        }
        if (MemoType.AskTicks == line) {
            return memo_close(this._ask_ticks(copy as MemoAskTicks))
        }

        if (MemoType.SayTock == line) {
            return memo_close(this._say_tock(copy as MemoSayTock))
        }
        if (MemoType.SayTack == line) {
            return memo_close(this._say_tack(copy as MemoSayTack))
        }
        if (MemoType.SayTicks == line) {
            return memo_close(this._say_ticks(copy as MemoSayTicks))
        }

        throw err(`unrecognized turn line: ${line}`)
    }

    _ask_tock(memo :MemoAskTock) :OpenMemo {
        let [line, body] = memo
        let tail = body as Mash

        // get the next tock after `tail` *in the best branch*
        let best = this.rock.read_one(rkey('best'))
        let snap, foldkey, fold;
        this.rock.rite(r => { // TODO ergonomics / getters
            let fold = r.find_max(rkey('fold', best), 29) // TODO no magic constant
            ;[foldkey, fold] = fold
            ;[snap,] = unroll(fold)
        })
        let next;
        this.tree.look(snap, (rock,twig) => {
            let pent = twig.read_pent(tail, h2b('07'))
            if (pent) {
                ;[ ,next] = pent
            }
        })
        if (next) {
            let tockroll = this.rock.read_one(rkey('tock', next))
            let tock = unroll(tockroll) as Tock
            return [MemoType.SayTock, tock]
        } else {
            throw err(`todo no next tock at hash ${b2h(tail)}, snap ${b2h(snap)}`)
        }
    }

    _ask_tack(memo :MemoAskTack) :OpenMemo {
        let [line, body] = memo
        let [tockhash, idx] = body as [Mash, Blob]
        let tackroll = this.rock.read_one(rkey('tack', tockhash, idx))
        if (blen(tackroll) > 0) {
            let tack = unroll(tackroll) as Tack
            return [MemoType.SayTack, tack]
        } else {
            throw err(`todo no such tack`)
        }
    }

    _ask_ticks(memo :MemoAskTicks) :OpenMemo {
        let [line, body] = memo
        let tickhashes = body as Mash[]
        let ticks = []
        this.rock.rite(r => { // todo readonly
            tickhashes.forEach(tickhash => {
                let tickroll = r.read(rkey('tick', tickhash))
                if (blen(tickroll) > 0) {
                    let tick = unroll(tickroll) as Tick
                    ticks.push(tick)
                }
            })
        })
        return [MemoType.SayTicks, ticks]
    }

    _say_tock(memo :MemoSayTock) :OpenMemo {
        let [line, body] = memo
        let tock = body as Tock
        let prevhash = tock[0]
        let prevroll = this.rock.read_one(rkey('tock', prevhash))
        let tockroll = roll(tock)
        let tockhash = mash(tockroll)

        if (blen(prevroll) == 0) {
            return [MemoType.Err, [t2b('unavailable'), prevhash]]
        }

        let prev = unroll(prevroll) as Tock
        let [ok, ] = vinx_tock(prev, tock)
        if (!ok) {
            return [MemoType.Err, [t2b('invalid'), tockhash]]
        }

        this.rock.etch_one(rkey('tock', tockhash), tockroll)

        return vult(this.tree, tock)
    }

    _say_tack(memo :MemoSayTack) :OpenMemo {
        let [line, body] = memo
        let tack = body as Tack
        let [tock, eye, ribs, feet] = tack
        let tockhash = mash(roll(tock))

        let [ok, ] = vinx_tack(tock, tack)
        if (!ok) {
            return [MemoType.Err, [t2b('invalid'), [tockhash, eye]]]
        }

        this.rock.etch_one(rkey('tack', tockhash, eye), roll(tack))

        return vult(this.tree, tock)
    }

    _say_ticks(memo :MemoSayTicks) :OpenMemo {
        let [line, body] = memo
        let ticks = body as Tick[]
        aver(_=> ticks.length <= 1024, `_say_ticks not split into chunks`)

        // vinx_tick check
        // TODO refactor for clarity
        let miss
        try { // wrap in try b/c we throw to abort dbtx
            this.rock.rite(r => { // todo readonly
                ticks.forEach(tick => {
                    let [moves, ments] = tick
                    let conx = []
                    moves.forEach(move => {
                        let [txin, idx, sig] = move
                        console.log('move', txin, idx, sig)
                        if (bnum(idx) == BigInt(7)) {
                            return // "continue" moves forEach
                        }
                        let conxroll = r.read(rkey('tick', txin))
                        if (blen(conxroll) == 0) {
                            miss = txin
                            throw err('unavailable')
                        }
                        let conxtick = unroll(conxroll) as Tick
                        conx.push(conxtick)
                    })
                    if (conx.length == 0) { // mint tick, TODO refactor for clarity
                        return // "continue" ticks forEach
                    }
                    let [ok, ] = vinx_tick(conx, tick)
                    if (!ok) {
                        miss = tick
                        throw err('invalid')
                    }
                })
            })
        } catch (e) {
            if (e.message.startsWith('unavailable')) {
                return [MemoType.Err, [t2b('unavailable'), miss]]
            }
            if (e.message.startsWith('invalid')) {
                return [MemoType.Err, [t2b('invalid'), miss]]
            }
            throw e
        }
        // end vinx_tick check

        let outs = [] // rebroadcast any new ticks
        this.rock.rite(r => {
            ticks.forEach(tick => {
                let tickhash = mash(roll(tick))
                let have = r.read(rkey('tick', tickhash))
                if (have.length == 0) {
                    r.etch_tick(tick)
                    outs.push(tick)
                }
            })
        })

        return [MemoType.SayTicks, outs]
    }

}
