// engine

import {
    Okay, okay, pass, fail, toss, aver,
    b2h, h2b, t2b,
    roll, unroll, bleq, islist,
    Tock,
    Mash, mash,
    Memo
} from './word.js'

// todo well task
import {
    form_tock,
} from './well.js'

// todo vinx task
import {
    vinx_tock
} from './vinx.js'

import {
    vult_thin
} from './vult.js'

import { Rock } from './rock.js'
import { Tree } from './tree.js'

export { Djin }

class Djin {
    rock :Rock   // content-addressed values
    tree :Tree   // per-tock view of state

    constructor(path :string) {
        this.rock = new Rock(path)
        this.tree = new Tree(this.rock)
        this.tree.etch_rock([t2b('best')], mash(roll(this.bang())))
        this.tree.etch_rock([t2b('tock'), mash(roll(this.bang()))], roll(this.bang()))
    }

    bang() {
        return [
            h2b('00'.repeat(24)),
            h2b('00'.repeat(24)),
            h2b('00'.repeat(7)),
            h2b('00'.repeat(7)),
        ]
    }
    tail() {
        return []
    }

    read(memo :Memo) :Okay<Memo> {
        let [line, body] = memo
        try { switch (line.toString()) {
            case 'ask/tocks': {
                let init = body as Mash; // tockhash
                // todo need init in history
                let best = this.tree.read_rock([t2b('best')])
                let lead = []
                let prev = best
                do {
                    console.log('prev', prev)
                    let blob = this.tree.read_rock([t2b('tock'), prev])
                    if (blob.length == 0) {
                        return fail(`no such tock: ${prev}`)
                    } else {
                        let tock = unroll(blob) as Tock
                        lead.push(tock)
                        prev = tock[0] // tock.prev
                    }
                } while( !bleq(prev, init)
                      && !bleq(prev, mash(roll(this.bang())))
                      && !bleq(prev, h2b('00'.repeat(24))) )
                return pass([Buffer.from('say/tocks'), lead])
            }
            case 'ask/tacks': {
                toss(`todo`)
            }
            case 'ask/ticks': {
                toss(`todo`)
            }
            default: return fail(`panic/unrecognized memo line ${line}`)
        } } catch (e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    turn(memo :Memo) :Okay<Memo> {
        let [line, body] = memo

        try { switch (line.toString()) {
            case 'say/tocks': {
                let tocks = body as Tock[]
                // form_mail / form_tock
                aver(_=> islist(tocks), `say/tocks arg must be a list`)
                aver(_=> tocks.every(t=>form_tock(t)), `say/tocks arg must be tocks list`)
                // vinx_tock
                //   todo
                for (let tock of tocks) {
                    let [ok,val,errs] = vult_thin(this.tree, tock)
                    toss(`todo djin vult_thin`)
                }
                return pass([])
            }
            case 'say/tacks': {
                // ...
                // tack_form
                // tack_vinx
                // rock.etch
                // outs << vult_part
                // outs << vult_full
                // send outs
            }
            case 'say/ticks': {
                // ...
                // tick_form
                // tick_vinx
                // rock.etch
                // later, do something smarter to know what vult to retry
                // for now, dumb sync will retry from ask/tocks
            }
            default: return fail(`unrecognized turn line: ${line}`)
        } } catch(e) {
            toss(`engine panic: ${e.message}`)
        }
    }

    async *_spin(next :Memo) : AsyncGenerator<void, Memo, void> {
        while (true) {
            let back = okay(this.turn(next))
            let [have, miss, errs] = this.turn(back)
            if (have) {
                next = okay(this.turn(miss))
                yield
            } else {
                return miss
            }
        }
        toss(`unreachable`)
    }

    async *spin(memos :Memo[]) : AsyncGenerator<Memo, void, void> {
        for (let memo of memos) {
            let miss
            for await (miss of this._spin(memo))
            { continue }
            yield miss
        }
    }

}
