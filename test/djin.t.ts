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
    need, rmap, memo_open, bleq, b2h, t2b
} from '../core/word.js'
import {readdirSync, readFileSync} from "fs";
import {dbgtick} from "./helpers.js";

const dbgmemo = (omemo) => {
    let type = omemo[0]
    let body = omemo[1]
    // only log on say/*
    if (MemoType.SayTocks == type || MemoType.SayTacks == type || MemoType.SayTicks == type) {
        body.forEach(t => {
            const t_s = rmap(t, b2h)
            const hash = mash(roll(t)).toString('hex')
            debug('send', Number(type).toString(16), t_s, hash)
            if (MemoType.SayTicks == type) dbgtick(t)
            if (MemoType.SayTacks == type) debug(`merk: ${b2h(merk(t[3]))}`)
        })
    }
}

const flatten = x => {
    if (isNaN(Number('0x'+x))) {
        return t2b(x)
    }
    return h2b(x)
}

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

const runcase = (dir, name, full=false) => {
    if (!name.endsWith('.jams')) return
    test(`${full ? 'full' : 'thin'} ${name}`, t => {
        debug(`TESTING: ${dir + name}`)
        let djin = new Djin('./test/db', true, full)
        let path = dir + name
        let file = readFileSync(path)
        let data = jams(file.toString())
        let prev
        data.forEach((cmd, idx) => {
            let func = cmd[0]
            need(func == 'send' || func == 'want', 'only doing send and want for now...')
            if ('send' == func) {
                let memo = rmap(cmd[1], h2b)
                dbgmemo(memo_open(memo))
                let [ok, val, err] = djin.turn(memo)
                let out = memo_open(val)
                prev = val
                t.equal(ok, true, `${name} send ${rmap(cmd[1], b2h)}`)
            }
            if ('want' == func) {
                debug(`want (actual=[${rmap(prev, b2h)}]) expected=[${cmd[1]}`)
                debug(bleq(roll(rmap(cmd[1], flatten)), roll(prev)))
                if (!bleq(roll(rmap(cmd[1], flatten)), roll(prev))) {
                    console.log(`want fail expected`, cmd[1], 'actual', rmap(prev, b2h))
                    t.fail(`want fail expected=${cmd[1]} actual=${rmap(prev, b2h)}`)
                }
            }
        })
        djin.kill()
    })
}

test('djin jams', t=>{
    let dir = './test/case/djin/thin/'
    let cases = readdirSync(dir)

    cases.forEach(c => runcase(dir, c))
})

test('full djin jams', t=>{
    let dir = './test/case/djin/full/'
    let cases = readdirSync(dir)

    cases.forEach(c => runcase(dir, c, true))
})

/*
test('full djin jams', t=>{
    let dir = './test/case/djin/full/'
    let cases = readdirSync(dir)

    cases.forEach(name => {
        if (!name.endsWith('.jams')) return
        test(`full ${name}`, t => {
            debug(`TESTING: ${dir + name}`)
            let djin = new Djin('./test/db', true, true)
            let path = dir + name
            let file = readFileSync(path)
            let data = jams(file.toString())
            let prev
            data.forEach((cmd, idx) => {
                let func = cmd[0]
                need(func == 'send' || func == 'want', 'only doing send and want for now...')
                if ('send' == func) {
                    let memo = rmap(cmd[1], h2b)
                    dbgmemo(memo_open(memo))
                    let [ok, val, err] = djin.turn(memo)
                    let out = memo_open(val)
                    prev = val
                    t.equal(ok, true, `${name} send ${rmap(cmd[1], b2h)}`)
                }
                if ('want' == func) {
                    debug(`want (actual=[${rmap(prev, b2h)}]) expected=[${cmd[1]}`)
                    debug(bleq(roll(rmap(cmd[1], flatten)), roll(prev)))
                    if (!bleq(roll(rmap(cmd[1], flatten)), roll(prev))) {
                        console.log(`want fail expected`, cmd[1], 'actual', rmap(prev, b2h))
                        t.fail(`want fail expected=${cmd[1]} actual=${rmap(prev, b2h)}`)
                    }
                }
            })
            djin.kill()
        })
    })
})

 */