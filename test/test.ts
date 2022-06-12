import { test } from 'tapzero'
import { jams } from 'jams.js'
import { readdirSync, readFileSync } from 'fs'

import { rmap, blob } from 'coreword'

import * as formtest from './form.t.js'

formtest

import { need } from '../core/word.js'
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
	test(`\nfile ${name} -- ${data.note}`, t=>{
            need(data.func, 'must give test func')
            need(data.args, 'must give test args')
            need(data.want, 'must give test want')
            need(data.want.length == 2, 'want must be len 2, use result type')
	    need($[data.func], `test func must be bound for ${data.func}`)
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
