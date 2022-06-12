import { test } from 'tapzero'

import { Okay, okay, h2b } from '../core/word.js'
import { form_tick } from '../core/well.js'

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

