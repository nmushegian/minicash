import { test } from 'tapzero'
import { okay, blob, Sign } from '../core/type.js'
import { tick_form } from '../core/well.js'

test('misc', t=>{
    okay(tick_form([]))
    let b = blob('00')
    t.ok(true)
})
