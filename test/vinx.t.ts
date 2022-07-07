import { test } from 'tapzero'
import { jams } from 'jams.js'
import Debug from 'debug'
const debug = Debug('vinx::test')
const debugkeys = Debug('vinx::keys')
const debugtxin = Debug('vinx::txin')
const debugtock = Debug('vinx::tock')


import {
    roll, h2b,
    sign, scry,
    Tick, Tock,
    addr, t2b, need,
    rmap, mash, bleq, merk
} from '../core/word.js'
import {
    form_tick
} from '../core/well.js'
import {dbgtick} from './helpers.js'

import {
    _checksig,
    vinx_tick,
    vinx_tock,
    vinx_tack
} from '../core/vinx.js'
import elliptic from 'elliptic'
import {readdirSync, readFileSync} from "fs";
const ec = new elliptic.ec('secp256k1')

test('checksig', t=>{ try {
    const keypair = ec.genKeyPair()
    const seck = keypair.getPrivate().toBuffer()
    const pubk = Buffer.from(keypair.getPublic().encodeCompressed())
    const code = addr(pubk) // in prev tick

    let tick = [[
        ['aa'.repeat(24), '00', 'cc'.repeat(65)].map(h2b)
    ],[
        [code, '0000ffffffffff',].map(h2b)
    ]] as Tick
    form_tick(tick)
    const move = tick[0][0]
    const ments = tick[1]
    const mask = roll([
        t2b("minicash movement"),
        [ [ move[0], move[1], t2b('') ] ],
        ments
    ])

    let sig = sign(mask, seck)

    tick[0][0][2] = sig

    form_tick(tick)
    let ok = _checksig(tick, 0, code)
    t.ok(ok, 'checksig must succeed')
    sig[37] = ~sig[37]
    tick[0][0][2] = sig
    form_tick(tick)
    ok = _checksig(tick, 0, code)
    t.ok(!ok, 'checksig must fail')
} catch (e) { t.ok(false, e.reason) }})

const makefeet = x => {
    let feet = []
    for (let i = 0; i < x; i++) {
        let hex = Number(i).toString(16)
        if (hex.length == 1) {
            hex = '0' + hex
        }
        feet.push(mash(h2b(hex)))
    }
    return feet
}
test('vinx_tack', t=> {
    const tock = [
        '00'.repeat(24),
        'a53a45d1b2be6a113a3170c9dafd976d1099d5b862b83e1f',
        '00'.repeat(6) + '39',
        '00'.repeat(7)
    ].map(h2b) as Tock
    const eye = h2b('00')
    const ribs = [
        '83b4282db216b3261120d479ab6f0f70b50f4345d79c64c9',
        'e53e9f9941199fd10480771ceb747af31da36d60b613e235'
    ].map(h2b)

    const feet = makefeet(1536)
    const [ok, val, err] = vinx_tack(tock, [tock, eye, ribs, feet])
    t.equal(ok, true, `vinx_tack ${err}`)
})

test('merk', t=> {
    const cmp = (expected, actual) => {
        let ok = bleq(expected, actual)
        t.equal(ok, true, `merk expected: ${expected.toString('hex')} actual: ${actual.toString('hex')}`)
    }
    let feet = makefeet(1)
    let expected = feet[0]
    let actual = merk(feet)
    cmp(expected, actual)

    feet = makefeet(2)
    expected = mash(Buffer.concat(feet))
    actual = merk(feet)
    cmp(expected, actual)

    feet = makefeet(3)
    const zero = h2b('00'.repeat(24))
    expected = mash(Buffer.concat([
        mash(Buffer.concat([feet[0], feet[1]])),
        mash(Buffer.concat([feet[2], zero]))
    ]))
    actual = merk(feet)
    t.equal(feet.length, 3, `merk must not modify its input`)
    cmp(expected, actual)

    feet = makefeet(4)
    expected = mash(Buffer.concat([
        mash(Buffer.concat([feet[0], feet[1]])),
        mash(Buffer.concat([feet[2], feet[3]]))
    ]))
    actual = merk(feet)
    cmp(expected, actual)

    feet = makefeet(5)
    expected = mash(Buffer.concat([
        mash(Buffer.concat([
            mash(Buffer.concat([feet[0], feet[1]])),
            mash(Buffer.concat([feet[2], feet[3]]))
        ])),
        mash(Buffer.concat([
            mash(Buffer.concat([feet[4], zero])),
            zero
        ]))
    ]))
    actual = merk(feet)
    cmp(expected, actual)
})

let $ = {
    vinx_tick,
    vinx_tock
}

test('cases', t=>{
    let dir = './test/case/vinx'
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
                const res = val
            } else {
                t.equal(data.want[0], "false", `must fail`)
                t.equal(data.want[1], err.message, `error strings must match`)
                if (data.func == 'vinx_tick') {
                    const ticks = [...args[0], args[1]]
                    ticks.forEach(dbgtick)
                } else if (data.func == 'vinx_tock') {
                    const prev = args[0]
                    debugtock(`prev roll: ${mash(roll(prev)).toString('hex')}`)
                }
            }
        })
    })
})

