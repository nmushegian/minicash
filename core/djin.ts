// engine



import Debug from 'debug'
const debug = Debug('cash:djin')

import {
    Okay, pass, fail, toss, aver, need, err,
    b2h, h2b, n2b, b2t, t2b,
    Blob, bleq,
    roll, unroll, rmap, islist,
    mash, tuff,
    Tick, Tock,
    Memo, MemoType, MemoErr,
    MemoSayTicks, MemoSayTacks, MemoSayTocks,
    MemoAskTicks, MemoAskTacks, MemoAskTocks,
    memo_open, memo_close,
} from './word.js'

import { form_memo, form_tock } from "./well.js";
import { vinx_tick, vinx_tack, vinx_tock} from "./vinx.js";
import { vult_thin, vult_full } from './vult.js'

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
        this.tree.grow(h2b(''), (rite,twig,snap) => {
            /*
            rite.etch(rkey('best'), banghash)
            rite.etch(rkey('tock', banghash), bangroll)
            rite.etch(rkey('work', banghash), n2b(tuff(bangroll)))
            rite.etch(rkey('fold', banghash, n2b(BigInt(0))), roll([snap, n2b(BigInt(0))]))
            let left = BigInt(2) ** BigInt(53)
            rite.etch(rkey('left', n2b(BigInt(0))), n2b(left))
            rite.etch(rkey('know', banghash), t2b('DV'))
            */
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

    _ask_ticks(memo :MemoAskTicks) :MemoSayTicks|MemoErr {
        throw err(`todo _ask_ticks`)
        /*
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
        */
    }

    _say_ticks(memo :MemoSayTicks) :MemoSayTicks|MemoErr {
        throw err(`todo _say_ticks`)
        /*
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
        */
    }

    _say_tacks(memo :MemoSayTacks) :MemoAskTocks|MemoAskTacks|MemoAskTicks|MemoErr {
        throw err(`say_tacks`)
        /*
        debug('say/tacks')
        let [line, tacks] = memo
        aver(_ => tacks.length == 1, `only saying one tack at a time for now`)
        let tack = tacks[0]
        let [head, eye,,] = tack

        aver(_ => {let res = vinx_tack(head, tack); return res[0]}, `panic, tack must be valid-in-context`)

        let headhash = mash(roll(head))
        this.rock.etch_one(rkey('tack', headhash, eye), roll(tack))

        return this._say_tocks([MemoType.SayTocks, [head]])
        */
    }

    _ask_tacks(memo :MemoAskTacks) :MemoSayTacks {
        throw err(`todo ask_tacks`)
        /*
        let [line, tockhash] = memo

        let tacks = []
        for (let eye = 0; eye < 128; eye++) {
            let tackroll = this.rock.read_one(rkey('tack', tockhash, n2b(BigInt(eye))))
            if (!bleq(tackroll, t2b(''))) {
                tacks.push(unroll(tackroll))
            }
        }
        return [MemoType.SayTacks, tacks]
        */
    }

    // ['ask/tocks tailhash ]  ->  'say/tocks tocks
    // ['ask/tocks Mash     ]  ->  'say/tocks Tock[]
    _ask_tocks(memo :MemoAskTocks) :MemoSayTocks|MemoErr { // | MemoSayTacks  todo
        throw err(`ask_tocks`)
        /*
        // todo need tail in history
        let [line, body] = memo;
        let tail = body as Blob
        let lead = []
        let best = this.rock.read_one(rkey('best'))
        if (bleq(best, tail)) {
            return [MemoType.Err, ['unavailable', best]]
        }
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
        */
    }

    // 'say/tocks Tock[]  ->  'ask/tocks tock:Mash
    //                    ->  'ask/tacks tock:Mash,i:num
    _say_tocks(memo :MemoSayTocks) :(MemoAskTocks|MemoAskTacks|MemoAskTicks) {
        throw err(`say_tocks`)
        /*
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

        debug(`etching ${b2h(mash(roll(tock)))} banghash=${b2h(mash(roll(this.bang)))}`)
        this.tree.rock.etch_one(rkey('tock', mash(roll(tock))), roll(tock))

        if (true) { // this.full
            return vult_full(this.tree, tock) as MemoAskTacks|MemoAskTocks|MemoAskTicks
        }

        return vult_thin(this.tree, tock) as MemoAskTocks
        */
    }

}
