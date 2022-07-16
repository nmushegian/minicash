import Debug from 'debug'
const dub = Debug('cash:djin')

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

import { readdirSync, readFileSync } from "fs";

const runcase = (dir, name) => {
    if (!name.endsWith('.jams')) return
    test(`${name}`, t => {
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
                t.deepEqual(memo, out)
                continue
            }
            throw err(`unrecognized test command`)
        }
        djin.kill()
    })
}

test('djin', t=>{
    let dir = './test/case/djin/'
    let cases = readdirSync(dir)

    cases.forEach(c => runcase(dir, c))
})

