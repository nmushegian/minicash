import Debug from 'debug'
const dub = Debug('cash:djin')

import { test } from 'tapzero'
import { jams } from 'jams.js'

import { Djin } from '../core/djin.js'

import {
    b2h, h2b, n2b, t2b,
    okay, need,
    bleq, bnum, extend,
    roll, rmap,
    mash, merk, addr,
    MemoType, memo, memo_close, memo_open,
    sign,
    Tick, Tack, Tock
} from '../core/word.js'

import { readdirSync, readFileSync } from "fs";

const flatten = x => {
    if (isNaN(Number('0x'+x))) {
        return t2b(x)
    }
    return h2b(x)
}

const runcase = (dir, name) => {
    if (!name.endsWith('.jams')) return
    test(`${name}`, t => {
        dub(`TESTING: ${dir + name}`)
        let djin = new Djin('./test/db', true)
        let path = dir + name
        let file = readFileSync(path)
        let data = jams(file.toString())
        let prev
        for (let cmd of data) {
            let func = cmd[0]
            need(func == 'send' || func == 'want', 'only doing send and want for now...')
            if ('send' == func) {
                let memo = rmap(cmd[1], h2b)
                dub(memo_open(memo))
                let [ok, val, err] = djin.turn(memo)
                let out = memo_open(val)
                prev = val
                t.equal(ok, true, `${name} send ${rmap(cmd[1], b2h)}`)
            }
            if ('want' == func) {
                dub(`want (actual=[${rmap(prev, b2h)}]) expected=[${cmd[1]}`)
                dub(bleq(roll(rmap(cmd[1], flatten)), roll(prev)))
                if (!bleq(roll(rmap(cmd[1], flatten)), roll(prev))) {
                    t.fail(`want fail expected=${cmd[1]} actual=${rmap(prev, b2h)}`)
                    break
                }
            }
        }
        djin.kill()
    })
}

test('djin', t=>{
    let dir = './test/case/djin/'
    let cases = readdirSync(dir)

    cases.forEach(c => runcase(dir, c))
})

