import Debug from 'debug'
const dub = Debug('cash:djin:test')

import { test } from 'tapzero'
import { jams } from 'jams.js'

import { Djin } from '../core/djin.js'

import {
    b2h, h2b, n2b, t2b, b2t,
    okay, need, err,
    bleq, bnum, extend,
    roll, rmap,
    mash, merk, addr,
    MemoType, memo, memo_close, memo_open,
    sign,
    Tick, Tack, Tock
} from '../core/word.js'

import {
    mold_tick, mold_tock
} from '../core/cash.js'

import { readdirSync, readFileSync } from "fs";

const runcase = (dir, name, t) => {
    if (!name.endsWith('.jams')) return
    dub(`TESTING: ${dir + name}`)
    let djin = new Djin('./test/db', true)
    let path = dir + name
    let file = readFileSync(path)
    let data = jams(file.toString())
    let out
    for (let cmd of data) {
        let [func, memohex] = cmd
        let memo = rmap(memohex, h2b)
        if ('send' == func) {
            out = djin.turn(memo)
            continue
        }
        if ('want' == func) {
            if (!bleq(roll(memo), roll(out))) {
                dub('want failed')
                dub('want', memo)
                dub('got ', out)
            }
            t.deepEqual(memo, out)
            continue
        }
        if ('note' == func) {
            continue
        }
        throw err(`unrecognized test command`)
    }
    djin.kill()
}

test('djin', t=>{
    let dir = './test/case/djin/'
    let cases = readdirSync(dir)

    cases.forEach(c => test(c, t=> {
        runcase(dir, c, t)
    }))
})

test('canon', t=> {
    runcase('./test/case/djin/', 'canon.jams', t)
})

let trace = []
function send(memo) {
    trace.push(["send", memo])
}

test.only('generate canon', t=>{
    let djin = new Djin('./test/db', true)
    dub('bang tock', djin.bang)

    let tick1 = mold_tick()
        .move_tock(djin.bang)
        .ment(h2b('cc'.repeat(20)), BigInt(2**42))
        .mold()
    let tock1 = mold_tock()
        .prev( mash(roll(djin.bang)) )
        .root( merk([mash(roll(tick1))]) )
        .time( extend(n2b(BigInt(57)), 7) )
        .fuzz( h2b('4c1f020b99fdd3'))
        .mold()

    let out = djin.turn(memo_close([MemoType.SayTock, tock1]))
    console.log(out)
})
