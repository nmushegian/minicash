import { test } from 'tapzero'

import { Okay, Why, okay, blob } from '../core/type.js'
import { tick_form } from '../core/well.js'

test('tick_form', t=>{
    let blob33 = blob('33'.repeat(32))
    let blob32 = blob('32'.repeat(32))
    let blob7 = blob('07'.repeat(7))
    let blob1 = blob('01'.repeat(1))
    let [ok, res] = tick_form([
	[ [blob32, blob1, blob32] ],
	[ [blob33, blob7] ]
    ])
    t.ok(ok)
})

test('not both empty', t=>{
    let [ok, why] = tick_form([ [], [] ])
    t.ok(!ok, why)
})

