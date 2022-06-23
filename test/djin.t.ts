import { test } from 'tapzero'
import { jams } from 'jams.js'

import {Djin} from '../core/djin.js'

import Debug from 'debug'
const debug = Debug('djin::test')

import {
    Tick,
    okay,
    roll, h2b,
    mash, memo, merk, MemoType,
    need, rmap, memo_open, bleq, b2h
} from '../core/word.js'
import {readdirSync, readFileSync} from "fs";
import {dbgtick, dbgtock} from "./helpers.js";


test('djin', t=>{ try {
    let djin = new Djin('test/db', true)
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

    djin.kill()
} catch(e) { console.log(e); t.ok(false, e.message); }})

const dbgmemo = (omemo) => {
    let type = omemo[0]
    let body = omemo[1]
    if (MemoType.SayTocks == type) {
        body.forEach(tock => {
            const tock_s = rmap(tock, b2h)
            const hash = mash(roll(tock)).toString('hex')
            debug('say/tocks in:', tock_s, hash)
        })
    }
}
test('djin jams', t=>{
    let dir = './test/case/djin/'
    let cases = readdirSync(dir)

    cases.forEach(name => {
        if (!name.endsWith('.jams')) return
        let djin = new Djin('./test/db')
        let path = dir + name
        let file = readFileSync(path)
        let data = jams(file.toString())
        test(`${name}`, t => {
            let prev
            data.forEach((cmd, idx) => {
                let func = cmd[0]
                need(func == 'send' || func == 'want', 'only doing send and want for now...')
                /*
                let omemo = memo_open(memo)
                let type = omemo[0]
                if (MemoType.SayTocks)
                 */
                if ('send' == func) {
                    let memo = rmap(cmd[1], h2b)
                    dbgmemo(memo_open(memo))
                    let [ok, val, err] = djin.turn(memo)
                    let out = memo_open(val)
                    t.equal(ok, true, `${name} send`)
                    prev = val
                }
                if ('want' == func) {
                    debug(`want (prev=[${rmap(prev, b2h)}])`)
                    t.equal(bleq(roll(rmap(cmd[1], h2b)), roll(prev)), true, `${name} want`)
                }
            })
        })
    })
})
