// engine

import {
    aver,
    bleq,
    Blob,
    fail,
    h2b,
    islist,
    mash,
    Memo,
    memo_close,
    memo_open,
    MemoAskTacks,
    MemoAskTicks,
    MemoAskTocks,
    MemoErr,
    MemoSayTacks,
    MemoSayTicks,
    MemoSayTocks,
    MemoType,
    n2b,
    Okay,
    okay,
    pass,
    roll,
    t2b,
    Tick,
    Tock,
    toss,
    tuff,
    unroll
} from './word.js'

import {vult_full, vult_thin} from './vult.js'

import {Rock} from './rock.js'
import {rkey, Tree} from './tree.js'
import {form_memo, form_tick, form_tock} from "./well.js";
import Debug from 'debug'

const debug = Debug('djin::test')

export { Djin }

class Djin {
    rock :Rock   // content-addressed values
    tree :Tree   // per-tock view of state
    bang :Tock   // tock zero
    full :boolean

    constructor(path :string, reset=false, full=false) {
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
        this.full = full
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
        okay(form_memo(memo))
        try {
            let [wellformed,,] = form_memo(memo)
            if (!wellformed) {
                // todo is this ok?
                return pass(memo)
            }
            let copy = memo_open(memo)
            let line = copy[0]
            if (MemoType.AskTocks == line) {
                // -> say/tocks | err
                let memot = copy as MemoAskTocks
                let out = this._ask_tocks(memot)
                let typed = [Buffer.from([out[0]]), out[1]]
                return pass(typed)
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
                // -> err
                let memot = memo_open(memo) as MemoSayTocks
                let out = this._say_tocks(memot)
                let typed = [Buffer.from([out[0]]), out[1]]
                return pass(typed)
            }
            if (MemoType.SayTacks == line) {
                // -> ask/tocks    proceed
                // -> ask/tacks    proceed
                // -> ask/ticks    need ticks
                // return pass(this._say_tacks(memo)
                return pass(memo_close(this._say_tacks(copy as MemoSayTacks)))
            }
            if (MemoType.SayTicks == line) {
                // -> say/ticks    accept/rebroadcast
                // -> err
                return pass(memo_close(this._say_ticks(copy as MemoSayTicks)))
            }
            return fail(`unrecognized turn line: ${line}`)
        } catch(e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    _ask_ticks(memo :MemoAskTicks) :MemoSayTicks|MemoErr {
        let tickhashes = memo[1]

        let ticks = []
        tickhashes.forEach(tickhash => {
            let tick = unroll(this.rock.read_one(rkey('tick', tickhash)))
            ticks.push(tick)
        })

        if (ticks.length == 0) {
            return [MemoType.Err, ['invalid', memo_close(memo)]]
        }
        return [MemoType.SayTicks, ticks]
    }

    _say_ticks(memo :MemoSayTicks) :MemoSayTicks|MemoErr {
        const [line, body] = memo
        aver(_=>islist(body), `panic, djin say/ticks memo body is not a list`)
        aver(_=>body.length == 1, `panic, djin memo is not split into units`)

        const tick = body[0] as Tick
        aver(_ => okay(form_tick(tick)), `panic, djin say/ticks tick not well-formed`)
        const tickhash = mash(roll(tick))
        const key = rkey('tick', tickhash)
        if (bleq(this.rock.read_one(key), h2b(''))) {
            this.rock.etch_one(rkey('tick', tickhash), roll(tick))
            return [memo[0], [tick]]
        }

        return [MemoType.Err, ['invalid', memo_close(memo)]]
    }

    _say_tacks(memo :MemoSayTacks) :MemoAskTocks|MemoAskTacks|MemoAskTicks|MemoErr {
        debug('say/tacks')
        let [line, tacks] = memo
        aver(_ => tacks.length == 1, `only saying one tack at a time for now`)
        let tack = tacks[0]
        let [head, eye, ribs, feet] = tack
        let prev = head[0]

        let prevhash = mash(roll(prev))
        let headhash = mash(roll(head))
        if (bleq(t2b(''), this.rock.read_one(rkey('tock', headhash)))) {
            debug('say/tacks tock not found, sending ask/tocks')
            return [MemoType.AskTocks, prevhash]
        }

        this.rock.etch_one(rkey('tack', headhash), roll(tack))

        for (let i = 0; i < ribs.length; i++) {
            let oldtack = this.rock.read_one(rkey('tack', headhash, n2b(BigInt(i))))
            if (bleq(oldtack, t2b(''))) {
                debug('say/tacks other tacks not found.  sending ask/tacks')
                return [MemoType.AskTacks, headhash]
            }
        }

        let leftfeet = feet.filter(
            foot => bleq(t2b(''), this.rock.read_one(rkey('tick', foot)))
        )
        if (leftfeet.length > 0) {
            debug('say/tacks not all ticks found, sending ask/ticks')
            return [MemoType.AskTicks, leftfeet]
        }

        return vult_full(this.tree, head) as MemoAskTocks
    }

    _ask_tacks(memo :MemoAskTacks) :MemoSayTacks {
        let [line, tockhash] = memo

        let tacks = []
        for (let eye = 0; eye <= 128; eye++) {
            console.log(n2b(BigInt(eye)))
            let tackroll = this.rock.read_one(rkey('tack', tockhash, n2b(BigInt(eye))))
            if (bleq(tackroll, t2b(''))) {
                break
            }
            tacks.push(unroll(tackroll))
        }
        return [MemoType.SayTacks, tacks]
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

        let tock = tocks[0]
        if (this.full) {
            return vult_full(this.tree, tock) as MemoAskTacks|MemoAskTocks
        }

        return vult_thin(this.tree, tock) as MemoAskTocks
    }

}
