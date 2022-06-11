import { test } from 'tapzero'
import { jams } from 'jams.js'
import { readdirSync, readFileSync } from 'fs'

import { rmap, blob } from 'coreword'

import * as formtest from './form.t.js'

formtest

import { form_tick, form_tock } from '../core/form.js'

let $ = {
    form_tick,
    form_tock
}

test('cases', t=>{
    let dir = './test/case'
    let cases = readdirSync(dir)
    cases.forEach(name => {
	if (!name.endsWith('.jams')) return
	let file = readFileSync(dir + '/' + name)
	let data = jams(file.toString())
	test(`file ${name}\nnote ${data.note}`, t=>{
            t.ok(data.func, 'no test func')
            t.ok(data.args, 'no test args')
            t.ok(data.want, 'no test want')
            t.ok(data.want.length == 2, 'want must be len 2, use result type')
	    t.ok($[data.func], `no test func bound for ${data.func}`)
	    let func = $[data.func]
	    let args = rmap(data.args, blob)
	    let [ok, val, errs] = func(...args)
	    let want
	    if (ok) {
		want = [data.want[0], rmap(data.want[1], blob)];
	    } else {
		want = [data.want[0], errs]
	    }
	    t.deepEqual([ok.toString(), ok ? val : errs], want)
        })
    })
})
