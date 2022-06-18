import { test } from 'tapzero'


import * as djintest from './djin.t.js'
import * as rocktest from './rock.t.js'
import * as treetest from './tree.t.js'
import * as vinxtest from './vinx.t.js'
import * as welltest from './well.t.js'
import * as wordtest from './word.t.js'
import {readdirSync, readFileSync} from "fs";

djintest
rocktest
treetest
//vinxtest
welltest
wordtest

import { jams } from 'jams.js'
import {
    form_tick,
    form_tock
} from '../core/well.js'
import {
    vinx_tick
} from "../core/vinx.js";
import {
    Okay, okay, need,
    Blob, h2b, rmap,
} from '../core/word.js'

let $ = {
    form_tick,
    form_tock,
    vinx_tick
}

const testdir = (dir) => {
    test(`${dir}`, t => {
        let cases = readdirSync(dir)
        cases.forEach(name => {
            if (!name.endsWith('.jams')) return
            let file = readFileSync(dir + '/' + name)
            let data = jams(file.toString())
            test(`\nfile ${name} -- ${data.note}`, t => {
                need(data.func, 'must give test func')
                need(data.args, 'must give test args')
                need(data.want, 'must give test want')
                need(data.want.length == 2, 'want must be len 2, use result type')
                need($[data.func], `test func must be bound for ${data.func}`)
                let func = $[data.func]
                let args = rmap(data.args, h2b)
                let [ok, val, err] = func(...args)
                if (ok) {
                    t.ok(data.want[0] == "true", `must succeed`)
                } else {
                    t.equal(data.want[0], "false", `must fail`)
                    t.equal(data.want[1], err.message, `error strings didn't match`)
                }
            })
        })
    })
}

const dirs = [
    './test/case/well',
    './test/case/vinx'
]
dirs.forEach(testdir)



