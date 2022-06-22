import { test } from 'tapzero'
import { jams } from 'jams.js'

//import { tick } from '../core/cash.js'
import { Djin } from '../core/djin.js'


import {
    Tick,
    okay,
    roll, h2b,
    mash, memo, merk,
} from '../core/word.js'
import {readdirSync, readFileSync} from "fs";
import {need, rmap} from "../core/word.js";
import {form_tick, form_tock} from "../core/well";
import {dbgtick} from "./helpers.js";


test('djin', t=>{ try {
    let djin = new Djin('')
    let out
    out = okay(djin.turn(memo('ask/tocks', mash(roll(djin.bang)))))
    t.deepEqual(out, memo('say/tocks', [djin.bang]))

    let tick1 = [[
        [] // no moves
    ],[
        [h2b('00'.repeat(20)), h2b('00'.repeat(7))] // 1 ment with miner reward
    ]]

    let tack1 = [
        undefined, // head
        [], // eyes
        [merk([mash(roll(tick1 as Tick))])],
        [tick1],
    ]

    let tock1 = [
        mash(roll(djin.bang)),
        merk([mash(roll(tick1 as Tick))]),
        h2b('00'.repeat(6) + '39'), // 57 in hex
        h2b('ff'.repeat(7))
    ]

    tack1[0] = tock1

    // give to djin
    out = okay(djin.turn(memo('say/tocks', [tock1])))
    // djin asks for tack

    t.deepEqual(out, memo('ask/tocks', mash(roll(tock1))))
} catch(e) { console.log(e); t.ok(false, e.message); }})

test('djin jams', t=>{
    let dir = './test/case/djin/'
    let name = 'djin.jams'
    let path = dir + name
    let djin = new Djin('')
    if (!name.endsWith('.jams')) return
    let file = readFileSync(path)
    let data = jams(file.toString())
    need(data.mail, 'must give test mail')
    need(data.want, 'must give test want')
    need(data.want.length == 2, 'want must be len 2, use result type')

    data.mail.forEach((memo, idx) => {
        let djin = new Djin('')
        let type = memo[0]
        let body = memo[1]
        let [ok, val, err] = djin.turn([memo[0], rmap(memo[1], h2b)])
        if (ok) {
            t.ok(data.want[0] == "true", `must succeed`)
            const res = val
        } else {
            t.equal(data.want[0], "false", `must fail`)
            t.equal(data.want[1], err.message, `error strings must match`)
            if (type == 'say/ticks') {
                body.forEach(dbgtick)
            }
        }
    })

    /*
    let line = data.args[0]
    let body = rmap(data.args, h2b)
    //let [ok, val, err] = func(...args)
    t.ok(true, 'hi')
    if (ok) {
        t.ok(data.want[0] == "true", `must succeed`)
    } else {
        t.equal(data.want[0], "false", `must fail`)
        t.equal(data.want[1], err.message, `error strings must match`)
    }

     */
})
