// engine

import {
    b2h,
    memo_close,
    MemoErr, rmap, Snap,
    Tack,
    Tick,
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

import {vult_full, vult_thin} from './vult.js'

import {vinx_tack, vinx_tick, vinx_tock} from "./vinx.js";

import Debug from 'debug'
const debug = Debug('djin::test')
import { Rock } from './rock.js'
import { Tree, rkey } from './tree.js'
import {form_memo, form_tick, form_tock} from "./well.js";

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
            let left = BigInt(2) ** BigInt(53) - BigInt(1)
            rite.etch(rkey('left', n2b(BigInt(0))), n2b(BigInt(2) ** BigInt(53) - BigInt(1)))
            let nextleft = left - (left / (BigInt(2) ** BigInt(21)))
            twig.etch(rkey('ment', banghash, h2b('07')), roll([banghash, n2b(left - nextleft)])) // [code, cash]
            twig.etch(rkey('know', banghash), t2b('DV'))
            twig.etch(rkey('pyre', banghash), n2b(BigInt(536112000))) // 17y
        })
        this.full = full
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
        aver(_ => okay(form_memo(memo))[0], 'memo not well-formed')
        let [wellformed, ,] = form_memo(memo)
        if (!wellformed) {
            // todo is this ok?
            return pass(memo)
        }
        let copy = memo_open(memo)
        let line = copy[0]
        if (MemoType.AskTocks == line) {
            // -> say/tocks | err
            let memot = copy as MemoAskTocks
            return pass(memo_close(this._ask_tocks(memot)))
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
            return pass(memo_close(this._say_tocks(memot)))
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

        let [moves, ments] = tick
        let tock
        let conx
        aver(
            _ => {
                conx = moves
                    .filter(move => {
                        if (Number('0x' + b2h(move[1])) == 7) {
                            tock = unroll(this.rock.read_one(rkey('tock', move[0]))) as Tock
                            return false
                        }
                        return true
                    })
                    .map(move => unroll(this.rock.read_one(rkey('tick', move[0]))) as Tick)
                // todo multiple block reward/subsidy transactions?
                let res = vinx_tick(conx, tick, tock)
                //console.error(res[2])
                return res[0]
            }
            , `panic, tick must be valid-in-context`
        )

        debug(`say/ticks ${rmap(tick, b2h)} hash=${b2h(mash(roll(tick)))}`)
        const tickhash = mash(roll(tick))
        const key = rkey('tick', tickhash)
        if (bleq(this.tree.rock.read_one(key), h2b(''))) {
            this.tree.rock.etch_one(rkey('tick', tickhash), roll(tick))
            return [MemoType.SayTicks, [tick]]
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

        aver(_ => {let res = vinx_tack(head, tack); return res[0]}, `panic, tack must be valid-in-context`)

        let headhash = mash(roll(head))
        let prevhash = mash(roll(prev))
        this.rock.etch_one(rkey('tack', headhash, eye), roll(tack))

        let tockroll = this.rock.read_one(rkey('tock', headhash))
        if (bleq(t2b(''), tockroll)) {
            debug('say/tacks tock not found, sending ask/tocks')
            return [MemoType.AskTocks, prevhash]
        }

        if (this.full) {
            return vult_full(this.tree, head)
        }

        if (bleq(t2b(''), tockroll)) {
            return vult_thin(this.tree, head, !this.full)
        }

        return [MemoType.AskTocks, headhash]
    }

    _ask_tacks(memo :MemoAskTacks) :MemoSayTacks {
        let [line, tockhash] = memo

        let tacks = []
        for (let eye = 0; eye <= 128; eye++) {
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
    _say_tocks(memo :MemoSayTocks) :(MemoAskTocks|MemoAskTacks|MemoAskTicks) {
        let [line, body] = memo
        aver(_=>islist(body), `panic, say/tocks takes a list`)
        body.forEach(b => aver(_=>form_tock(b)[0], `panic, say/tocks takes a list of tocks`))
        aver(_ => body.length == 1, `panic, say/tocks memos can only hold one tock for now`) // TODO
        let tocks = body as Tock[]
        let tock = tocks[0]
        let prevhash = tock[0]
        aver(_ => {
            let prev = this.rock.read_one(rkey('tock', prevhash))
            if (bleq(prev, t2b(''))) {
                console.error(`panic, _say_tocks: prev not found ${b2h(prevhash)}`)
                return false
            }
            let res = vinx_tock(unroll(prev) as Tock, tock)
            if (!res[0]) debug('err: ', res[2])
            return res[0]
        }, 'panic, tock must be valid-in-context')

        if (this.full) {
            return vult_full(this.tree, tock) as MemoAskTacks|MemoAskTocks|MemoAskTicks
        }

        return vult_thin(this.tree, tock) as MemoAskTocks
    }

}
