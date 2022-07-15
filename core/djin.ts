// engine

import Debug from 'debug'
const dub = Debug('cash:djin')

import {
    Okay, pass, fail, toss, aver, need, err,
    b2h, h2b, n2b, b2t, t2b,
    Blob, bleq, blen, extend,
    roll, unroll, rmap, islist,
    Mash, mash, tuff,
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
        dub('banghash', banghash)
        this.tree.grow(h2b(''), (rite,twig,snap) => {
            rite.etch_best(banghash)
            rite.etch_tock(this.bang)
            rite.etch_work(banghash, tuff(bangroll))
            rite.etch_fold(banghash, 0, snap, 0)
            rite.etch_know(banghash, t2b('DV'))
            twig.etch( rkey('ment', banghash, h2b('07')),
                       roll([h2b(''), n2b(BigInt(2)**BigInt(53))]) )
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
            return memo_close([MemoType.Err, ['invalid', memo]])
        }

        let copy = memo_open(memo)
        let line = copy[0]

        if (MemoType.AskTocks == line) {
            return memo_close(this._ask_tocks(copy as MemoAskTocks))
        }
        if (MemoType.AskTacks == line) {
            return memo_close(this._ask_tacks(copy as MemoAskTacks))
        }
        if (MemoType.AskTicks == line) {
            return memo_close(this._ask_ticks(copy as MemoAskTicks))
        }

        if (MemoType.SayTocks == line) {
            return memo_close(this._say_tocks(copy as MemoSayTocks))
        }
        if (MemoType.SayTacks == line) {
            return memo_close(this._say_tacks(copy as MemoSayTacks))
        }
        if (MemoType.SayTicks == line) {
            return memo_close(this._say_ticks(copy as MemoSayTicks))
        }

        throw err(`unrecognized turn line: ${line}`)
    }

    // TODO test coverage
    _ask_tocks(memo :MemoAskTocks) :OpenMemo {
        let [line, body] = memo
        let tail = body as Mash

        // get the next tock(s) after `tail` *in the best branch*
        let best = this.rock.read_one(rkey('best'))
        let snap;
        this.rock.rite(r => { // TODO ergonomics / getters
            let foldroll = r.find_max(rkey('fold', best), 29) // TODO no magic constant
            aver(_=> blen(foldroll) > 0, `panic, empty fold for best`)
            ;[snap, ] = unroll(foldroll)
        })
        // TODO batching:  nexts = [];  grab up to chunk size tocks
        // TODO empty is not a panic, you might not have it
        let next;
        this.tree.look(snap, (rock,twig) => {
            let pentroll = twig.read(rkey('pent', best, h2b('07')))
            aver(_=> blen(pentroll) > 0, `panic, empty pent for best`)
            ;[ , next] = unroll(pentroll)
        })
        let tockroll = this.rock.read_one(rkey('tock', next))
        let tock = unroll(tockroll) as Tock
        return [MemoType.SayTocks, [tock]]
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

        let tock = tocks[0]
        let prevhash = tock[0]
        let prevroll = this.rock.read_one(rkey('tock', prevhash))
        if (blen(prevroll) == 0) {
            return [MemoType.Err, ['unavailable', prevhash]]
        }

        // TODO vinx here

        let tockroll = roll(tock)
        let tockhash = mash(tockroll)
        this.rock.etch_one(rkey('tock', tockhash), tockroll)

        return vult(this.tree, tock)
    }

    _say_tacks(memo :MemoSayTacks) :OpenMemo {
        let [line, body] = memo
        let tacks = body as Tack[]
        aver(_=> tacks.length == 1, `_say_tacks memo not split into units`)

        // TODO vinx here

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

        // TODO vinx here

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
