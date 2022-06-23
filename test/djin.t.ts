import { test } from 'tapzero'
import { jams } from 'jams.js'

import {Djin} from '../core/djin.js'


import {
    Tick,
    okay,
    roll, h2b,
    mash, memo, merk,MemoType,
    need, rmap, memo_open
} from '../core/word.js'
import {readdirSync, readFileSync} from "fs";
import {dbgtick, dbgtock} from "./helpers.js";


test('djin', t=>{ try {
    let djin = new Djin('')
    let out
    out = okay(djin.turn(memo(MemoType.AskTocks, mash(roll(djin.bang)))))
    t.deepEqual(out, memo(MemoType.SayTocks, [djin.bang]))

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
    out = okay(djin.turn(memo(MemoType.SayTocks, [tock1])))
    // djin asks for tack

    t.deepEqual(out, memo(MemoType.AskTocks, mash(roll(tock1))))
} catch(e) { console.log(e); t.ok(false, e.message); }})

test('djin jams', t=>{
    let dir = './test/case/djin/'
    let name = 'djin.jams'
    let path = dir + name
    let djin = new Djin('')
    if (!name.endsWith('.jams')) return
    let file = readFileSync(path)
    let data = jams(file.toString())
    data.forEach((cmd, idx) => {
        let func = cmd[0]
        need(func == 'send', 'only doing send for now...')
        let memo = rmap(cmd[1], h2b)
        let [ok, val, err] = djin.turn(memo)
        t.equal(ok, true, `pass`)
    })
})
