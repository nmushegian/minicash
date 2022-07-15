// engine

import Debug from 'debug'
const dub = Debug('cash:djin')

import {
    Okay, pass, fail, toss, aver, need, err,
    b2h, h2b, n2b, b2t, t2b,
    Blob, bleq, blen, extend,
    roll, unroll, rmap, islist,
    mash, tuff,
    Tick, Tack, Tock,
    Memo, MemoType, MemoErr,
    MemoSayTicks, MemoSayTacks, MemoSayTocks,
    MemoAskTicks, MemoAskTacks, MemoAskTocks,
    OpenMemo, memo_open, memo_close,
} from './word.js'

import { form_memo, form_tock } from "./well.js";
import { vinx_tick, vinx_tack, vinx_tock} from "./vinx.js";
import { vult } from './vult.js'

import { Rock } from './rock.js'
import { Tree, rkey } from './tree.js'

export { Djin }

class Djin {
    rock :Rock   // content-addressed values
    tree :Tree   // per-tock view of state
    bang :Tock   // tock zero

    constructor(path :string, reset=false) {
        this.rock = new Rock(path, reset)
        this.tree = new Tree(this.rock)
        this.bang = [
            h2b('00'.repeat(24)),
            h2b('00'.repeat(24)),
            h2b('00'.repeat(7)),
            h2b('00'.repeat(7)),
        ]
        let bangroll = roll(this.bang)
        let banghash = mash(bangroll)
        console.log('banghash', banghash)
        this.tree.grow(h2b(''), (rite,twig,snap) => {
            rite.etch_best(banghash)
            rite.etch_tock(this.bang)
            rite.etch_work(banghash, tuff(bangroll))
            rite.etch_fold(banghash, 0, snap, 0)
            rite.etch_left(BigInt(0), BigInt(2)**BigInt(53))
            rite.etch_know(banghash, t2b('DV'))
        })
    }

    kill() {
        this.rock.shut()
    }

    async *spin(memo) {
        // todo aver well-formed
        // todo aver valid-in-context

        // split up memo into units
        // turn/reflect/yield K turns at a time
        //   one unit memo can cause more than one turn

        // let memos = as_units(memo)
        // i = 0
        // for memo in memos
        //   let next = memo
        //   while true:
        //     let out = turn(memo)
        //     if (out.err)
        //       return out
        //     else
        //       next = out
        //     if (i++ % K == 0)
        //       yield

    }

    turn(memo :Memo) :Okay<Memo> {
        if (!form_memo(memo)[0]) {
            return pass(memo_close([MemoType.Err, ['invalid', memo]]))
        }

        let copy = memo_open(memo)
        let line = copy[0]

        if (MemoType.AskTocks == line) {
            // -> say/tocks | err
            return pass(memo_close(this._ask_tocks(copy as MemoAskTocks)))
        }
        if (MemoType.AskTacks == line) {
            // -> say/tacks | err
            return pass(memo_close(this._ask_tacks(copy as MemoAskTacks)))
        }
        if (MemoType.AskTicks == line) {
            // -> say/ticks | err
            return pass(memo_close(this._ask_ticks(copy as MemoAskTicks)))
        }

        if (MemoType.SayTocks == line) {
            // -> ask/tocks    proceed
            // -> ask/tacks    need tacks
            // -> ask/ticks    need ticks
            // -> err
            return pass(memo_close(this._say_tocks(copy as MemoSayTocks)))
        }
        if (MemoType.SayTacks == line) {
            // -> ask/tocks    proceed
            // -> ask/tacks    proceed
            // -> ask/ticks    need ticks
            return pass(memo_close(this._say_tacks(copy as MemoSayTacks)))
        }
        if (MemoType.SayTicks == line) {
            // -> say/ticks    accept/rebroadcast
            // -> err
            return pass(memo_close(this._say_ticks(copy as MemoSayTicks)))
        }

        return fail(`unrecognized turn line: ${line}`)
    }

    _ask_tocks(memo :MemoAskTocks) :OpenMemo {
        throw err(`ask_tocks`)
    }

    _ask_tacks(memo :MemoAskTacks) :MemoSayTacks {
        throw err(`todo ask_tacks`)
    }

    _ask_ticks(memo :MemoAskTicks) :MemoSayTicks|MemoErr {
        throw err(`todo _ask_ticks`)
    }

    _say_tocks(memo :MemoSayTocks) :OpenMemo {
        let [line, body] = memo
        let tocks = body as Tock[]
        aver(_=> tocks.length == 1, `_say_tocks memo not split into units`)

        // vinx here

        let tock = tocks[0]
        let prevhash = tock[0]
        let prevroll = this.rock.read_one(rkey('tock', prevhash))
        if (blen(prevroll) == 0) {
            return [MemoType.Err, ['unavailable', prevhash]]
        }

        return vult(this.tree, tock)
    }

    _say_tacks(memo :MemoSayTacks) :OpenMemo {
        let [line, body] = memo
        let tacks = body as Tack[]
        aver(_=> tacks.length == 1, `_say_tacks memo not split into units`)

        // vinx here

        let tack = tacks[0]
        let tock = tack[0]
        let eye  = tack[1]
        let tockhash = mash(roll(tock))
        this.rock.etch_one(rkey('tack', tockhash, eye), roll(tack))

        return vult(this.tree, tock)
    }

    _say_ticks(memo :MemoSayTicks) :OpenMemo {
        let [line, body] = memo
        let ticks = body as Tick[]
        aver(_=> ticks.length <= 1024, `_say_ticks not split into chunks`)

        // vinx here

        let outs = []
        this.rock.rite(r => {
            ticks.forEach(tick => {
                let tickhash = mash(roll(tick))
                let have = r.read(rkey('tick', tickhash))
                if (have.length == 0) {
                    r.etch(rkey('tick', tickhash), roll(tick))
                    outs.push(tick)
                }
            })
        })

        return [MemoType.SayTicks, outs]
    }

}
