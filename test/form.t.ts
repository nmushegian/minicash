import { test } from 'tapzero'

import { Okay, okay, blob } from '../core/type.js'
import { tick_form } from '../core/form.js'

test('tick_form', t=>{
    let blob32 = blob('32'.repeat(32))
    let blob20 = blob('20'.repeat(20))
    let blob7 = blob('07'.repeat(7))
    let blob1 = blob('01'.repeat(1))
    let [ok, res] = tick_form([
	[ [blob20, blob1, blob32] ],
	[ [blob20, blob7] ]
    ])
    t.ok(ok)
})

test('not both empty', t=>{
    let [ok, val, errs] = tick_form([ [], [] ])
    t.ok(!ok, errs)
})

