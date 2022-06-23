// engine

import {
    Okay, okay, pass, fail, toss, aver,
    h2b, t2b, b2t,
    Blob, isblob,
    roll, unroll, bleq, islist,
    Tock, tuff, n2b,
    Mash, mash,
    need, Memo, OpenMemo, MemoType,
    MemoSayTocks, MemoSayTacks, MemoSayTicks,
    MemoAskTocks, MemoAskTacks, MemoAskTicks, bnum, memo_open,
} from './word.js'

import {
    vult_thin
} from './vult.js'

import { Rock } from './rock.js'
import { Tree, rkey } from './tree.js'
import {form_tick, form_tock} from "./well.js";

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
        this.tree.grow(h2b(''), (rite,twig,snap) => {
            rite.etch(rkey('best'), banghash)
            rite.etch(rkey('tock', banghash), bangroll)
            rite.etch(rkey('work', banghash), n2b(tuff(bangroll)))
            rite.etch(rkey('fold', banghash, n2b(BigInt(0))), roll([snap, n2b(BigInt(0))]))
        })
    }

    kill() {
        this.rock.shut()
    }

    async *spin(memo) {
        // aver well-formed
        // aver valid-in-context
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
        try {
            let copy = memo_open(memo)
            let line = copy[0]
            if (MemoType.AskTocks == line) {
                // -> say/tocks | err
                let memot = copy as MemoAskTocks // todo form_memo
                let out = this._ask_tocks(memot)
                let typed = [Buffer.from([out[0]]), out[1]]
                return pass(typed)
            }
            if (MemoType.AskTacks == line) {
                // -> say/tacks | err
                toss(`todo djin read ask/tacks`)
            }
            if (MemoType.AskTicks == line) {
                // -> say/ticks | err
                toss(`todo djin read ask/ticks`)
            }
            if (MemoType.SayTocks == line) {
                // -> ask/tocks    proceed
                // -> ask/tacks    need tacks
                // -> err
                let memot = memo_open(memo) as MemoSayTocks// todo form_memo
                let out = this._say_tocks(memot)
                let typed = [Buffer.from([out[0]]), out[1]]
                return pass(typed)
            }
            if (MemoType.SayTacks == line) {
                // -> ask/tocks    proceed
                // -> ask/tacks    proceed
                // -> ask/ticks    need ticks
                // return pass(this._say_tacks(memo)
                toss(`todo turn say/tacks`)
            }
            if (MemoType.SayTicks == line) {
                // -> say/ticks    accept/rebroadcast
                // -> err
                return pass(this._say_ticks(memo))
                toss(`todo turn say/ticks`)
            }
            return fail(`unrecognized turn line: ${line}`)
        } catch(e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    // ['ask/tocks tailhash ]  ->  'say/tocks tocks
    // ['ask/tocks Mash     ]  ->  'say/tocks Tock[]
    _ask_tocks(memo :MemoAskTocks) :MemoSayTocks { // | MemoSayTacks  todo
        // todo need tail in history
        let [line, body] = memo;
        let tail = body as Blob
        let lead = []
        let best = this.rock.read_one(rkey('best'))
        let prev = best as unknown as Blob // mash
        let banghash = mash(roll(this.bang))
        do {
            let blob = this.rock.read_one(rkey('tock', prev))
            if (blob.length == 0) {
                toss(`no such tock: ${prev}`)
            } else {
                let tock = unroll(blob) as Tock
                lead.push(tock)
                prev = tock[0] // tock.prev
            }
        } while( !bleq(prev, tail) && !bleq(prev, banghash) && !bleq(prev, h2b('00'.repeat(24))) )
        return [MemoType.SayTocks, lead] as MemoSayTocks
    }

    // 'say/tocks Tock[]  ->  'ask/tocks tock:Mash
    //                    ->  'ask/tacks tock:Mash,i:num
    _say_tocks(memo :MemoSayTocks) :(MemoAskTocks|MemoAskTacks) {
        let [line, body] = memo
        aver(_=>islist(body), `panic, say/tocks takes a list`)
        body.forEach(b => aver(_=>form_tock(b)[0], `panic, say/tocks takes a list of tocks`))
        aver(_ => body.length == 1, `panic, say/tocks memos can only hold one tock for now`) // TODO
        let tocks = body as Tock[]
        // aver prev is possibly-valid

        let thinmemo = vult_thin(this.tree, tocks[0])// as MemoAskTocks // todo full
        let typed = thinmemo as (MemoAskTocks | MemoAskTacks)
        return typed
    }

    _say_ticks(memo :Memo) :Memo {
        const [line, body] = memo
        aver(_=>body.length == 1, `panic, djin memo is not split into units`)

        const ticks = body
        const rebro = []
        ticks.forEach(tick => {
            okay(form_tick(tick))
        })
        ticks.forEach(tick => {
            const tickhash = mash(roll(tick))
            const key = rkey(tick, tickhash)
            if (bleq(this.rock.read_one(key), h2b(''))) {
                this.rock.etch_one(rkey(tick, tickhash), roll(tick))
                rebro.push(tick)
            }
        })

        need(rebro.length > 0, 'no new transactions to add/rebroadcast')
        return [memo[0], rebro]
    }

}
