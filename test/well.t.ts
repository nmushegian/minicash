import { test } from 'tapzero'
import { jams } from 'jams.js'
import { readdirSync, readFileSync } from 'fs'

import {
    Okay, okay, need,
    Blob, h2b, rmap,
    mash, b2t, t2b, b2h, MemoType, memo, fail
} from '../core/word.js'

import {
    form_tick,
    form_tock,
    form_tack,
    form_memo
} from '../core/well.js'

test('tick_form', t=>{
    let blob65 = h2b('65'.repeat(65))
    let blob24 = h2b('24'.repeat(24))
    let blob20 = h2b('20'.repeat(20))
    let blob7 = h2b('07'.repeat(7))
    let blob1 = h2b('01'.repeat(1))
    let [ok, val, errs] = form_tick([
        [ [blob24, blob1, blob65] ],
        [ [blob20, blob7] ]
    ])
    t.ok(ok, errs)
})

test('form_tack', t=> {
    const tock = [
        '00'.repeat(24),
        '00'.repeat(24),
        '00'.repeat(6) + '39',
        '00'.repeat(7)
    ].map(h2b)
    const eye = h2b('00')
    let ribs = []
    for (let i = 0; i < 128; i++) {
        let hex = Number(i+1).toString(16)
        if (hex.length == 1) {
            hex = '0' + hex
        }
        const rib = h2b('00'.repeat(23) + hex)
        ribs.push(rib)
    }

    let feet = []
    for (let i = 0; i < 1024; i++) {
        let hex = Number(i+1).toString(16)
        if (hex.length == 1) {
            hex = '0' + hex
        }
        feet.push(mash(h2b(hex)))
    }

    const tack = [tock, eye, ribs, feet]
    let [ok, val, err] :any[] = form_tack([tock, eye, ribs, feet])
    t.equal(ok, true, `form_tack ${err}`)

    let m = memo(MemoType.SayTacks, [tack])
    ;[ok, val, err] = form_memo(m)
    t.equal(ok, true, 'memo is well-formed')
    if (!ok) console.error(err.message)

    m[1][0][1] = h2b('0000') // eye
    ;[ok, val, err] = form_memo(m)
    t.equal(ok, false, 'should fail')
    if (!ok) {
        t.equal(err.message, 'eye must be a blob of len 1', 'err strings not equal')
    }
})

test('not both empty', t=>{
    let [ok, val, errs] = form_tick([ [], [] ])
    t.ok(!ok, errs)
})

let $ = {
    form_tick,
    form_tock,
    form_tack,
    form_memo
}

let show =o=> JSON.stringify(o, null, 2)

test('cases', t=>{
    let dir = './test/case/well'
    let cases = readdirSync(dir)
    cases.forEach(name => {
        if (!name.endsWith('.jams')) return
        let file = readFileSync(dir + '/' + name)
        let data = jams(file.toString())
        test(`\n${name}\n  ${data.note}`, t=>{
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
                t.equal(data.want[1], err.message, `error strings must match`)
            }
        })
    })
})
