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
    rmap, mash
} from '../core/word.js'
import {
    form_tick
} from '../core/well.js'

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

test('vinx_tack', t=> {
    const tock = [
        '00'.repeat(24),
        'a30dc5e479c881e77ff703af85f8b8849e903a6065ac35b4',
        '00'.repeat(6) + '39',
        '00'.repeat(7)
    ].map(h2b) as Tock
    const eye = h2b('00')
    const ribs = [h2b('6a049dff6bef245137abe0c8b513cb3d6f252a2ba1ab3135')]

    let feet = []
    for (let i = 0; i < 1536; i++) {
        let hex = Number(i).toString(16)
        if (hex.length == 1) {
            hex = '0' + hex
        }
        feet.push(mash(h2b(hex)))
    }

    const [ok, val, err] = vinx_tack(tock, [tock, eye, ribs, feet])
    t.equal(ok, true, `vinx_tack ${err}`)
})


let $ = {
    vinx_tick,
    vinx_tock
}

const keys = {
    ali: 'e4c90c881b372adf66e8f566de63f560f48ef16a31c2aef9b860023ff9ab634f',
    bob: '9f092b266aec975d0d75fb1046ab8986262659fb88521a22500a92498780dce0',
    cat: '1d4d8c560879214483c8645fe4b60d0fb72033c0591716c7af2df787823cf3b7',
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
                    ticks.forEach((tick, tickidx) => {
                        try {
                            form_tick(tick)
                        } catch (err) {
                            debugkeys('not well formed (', err, ')')
                            return
                        }
                        const moves = tick[0]
                        const ments = tick[1]
                        debugtxin(`tick#${tickidx} txin (mash): ${mash(roll(tick)).toString('hex')}`)
                        moves.forEach((move, moveidx) => {
                            debugkeys(`tick#${tickidx}, move#${moveidx}`)
                            Object.entries(keys).forEach(entry => {
                                const name = entry[0]
                                const privkey = entry[1]
                                const seck = Buffer.from(entry[1], 'hex')
                                const mask = roll([
                                    t2b("minicash movement"),
                                    [[move[0], move[1], t2b('')]],
                                    ments
                                ])
                                const sig = sign(mask, seck)
                                const keypair = ec.keyFromPrivate(seck)
                                const pubkey = Buffer.from(keypair.getPublic().encodeCompressed())
                                debugkeys(
                                    '  ', name,
                                    `code:${addr(pubkey).toString('hex')}`,
                                    `sign:${sig.toString('hex')}`
                                )
                            })
                        })
                    })
                } else if (data.func == 'vinx_tock') {
                    const prev = args[0]
                    debugtock(`prev roll: ${mash(roll(prev)).toString('hex')}`)
                }
            }
        })
    })
})

