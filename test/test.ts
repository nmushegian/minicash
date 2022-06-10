import { test } from 'tapzero'
import { okay, blob, hash } from 'coreword'
import { Tock } from '../core/type.js'
import { tock_form } from '../core/well.js'

test('tock', _=>{
  test('tock_form', t=>{
    let ok, _
    
    let prev = hash(blob('01'))
    let root = hash(blob('02'))
    let time = hash(blob('03'))
    let fuzz = hash(blob('03'))
    let tock0 = [prev, root, time, fuzz]

    let tock1 = okay(tock_form(tock0))
    t.deepEqual(tock0, tock1)

    let tock2 = [ // wrong length
      tock0[1], tock0[2], tock0[3]
    ]
    ;[ok, _] = tock_form(tock2)
    t.ok(!ok)
  })
})

import { vult_thin, vult_full } from './vult'
