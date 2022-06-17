import { test } from 'tapzero'
import { jams } from 'jams.js'
import { readdirSync, readFileSync } from 'fs'

import {
    Okay, okay, need,
    Blob, h2b, rmap,
} from '../core/word.js'

import {
    form_tick,
    form_tock
} from '../core/well.js'

test('tick_form', t=>{
    let blob32 = h2b('32'.repeat(32))
    let blob24 = h2b('24'.repeat(24))
    let blob20 = h2b('20'.repeat(20))
    let blob7 = h2b('07'.repeat(7))
    let blob1 = h2b('01'.repeat(1))
    let [ok, val, errs] = form_tick([
        [ [blob24, blob1, blob32] ],
        [ [blob20, blob7] ]
    ])
    t.ok(ok, errs)
})

test('not both empty', t=>{
    let [ok, val, errs] = form_tick([ [], [] ])
    t.ok(!ok, errs)
})

let $ = {
    form_tick,
    form_tock
}

let show =o=> JSON.stringify(o, null, 2)

test('cases', t=>{
    let dir = './test/case/well'
    let cases = readdirSync(dir)
    cases.forEach(name => {
        if (!name.endsWith('.jams')) return
        let file = readFileSync(dir + '/' + name)
        let data = jams(file.toString())
        test(`\nfile ${name} -- ${data.note}`, t=>{
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
