import {test} from 'tapzero'
import {jams} from 'jams.js'

import {Djin} from '../core/djin.js'

import Debug from 'debug'
import {
    b2h, h2b, n2b, t2b, b2t,
    okay, need, err,
    bleq, bnum, extend,
    roll, rmap,
    mash, merk, addr,
    MemoType, memo, memo_close, memo_open,
    sign,
    Tick, Tack, Tock
} from '../core/word.js'
import {readdirSync, readFileSync} from "fs";
import {dbgtick, maketicks, keys} from "./helpers.js";

import elliptic from 'elliptic'
const ec = elliptic.ec('secp256k1')

const debug = Debug('cash:djin')

const dbgmemo = (omemo) => {
    let type = omemo[0]
    let body = omemo[1]
    // only log on say/*
    if (MemoType.SayTock == type || MemoType.SayTack == type) {
        let t = body
        const t_s = rmap(t, b2h)
        let hash = b2h(mash(roll(t)))
        if (MemoType.SayTack == type) {
            hash = b2h(mash(roll(t[0])))
        }
        debug('send', Number(type).toString(16), t_s, hash)
        if (MemoType.SayTicks == type) dbgtick(t)
        if (MemoType.SayTack == type) debug(`merk: ${b2h(merk(t[3]))}`)
    }
    if (MemoType.SayTicks == type) {
        body.forEach(t => {
            const t_s = rmap(t, b2h)
            let hash = b2h(mash(roll(t)))
            debug('send', Number(type).toString(16), t_s, hash)
            dbgtick(t)
        })
    }
}

const flatten = x => {
    if (isNaN(Number('0x'+x))) {
        return t2b(x)
    }
    return h2b(x)
}

test('djin', t=>{ try {
    let out

    let djin = new Djin('./test/db', true)
    let seck = Buffer.from(keys.ali, 'hex')
    let keypair = ec.keyFromPrivate(seck)
    let pubkey = Buffer.from(keypair.getPublic().encodeCompressed())
    let code = addr(pubkey)

    let prevmint = [
        [[mash(roll(djin.bang)), h2b('07'), h2b('00'.repeat(65))]],
        [[code, h2b('00000100000000')]]
    ] as Tick
    let prevtack = [[
        mash(roll(djin.bang)),
        mash(roll(prevmint)),
        extend(n2b(BigInt(57)), 7),
        h2b('00'.repeat(7))], h2b('00'), [], [mash(roll(prevmint))]
    ] as Tack
    djin.turn(memo_close([MemoType.SayTock, prevtack[0]]))
    djin.turn(memo_close([MemoType.SayTack, prevtack]))
    djin.turn(memo_close([MemoType.SayTicks, [prevmint]]))
    djin.turn(memo_close([MemoType.SayTock, prevtack[0]]))

    let ticks = maketicks(mash(roll(prevmint)), bnum(h2b('100000000')), 1027)
    let mint = [
        [[mash(roll(prevtack[0])), h2b('07'), h2b('00'.repeat(65))]],
        [[h2b('11'.repeat(20)), h2b('000000fffff800')]]
    ] as Tick
    ticks.push(mint)
    let feet  = ticks.map(t => mash(roll(t)))

    let ribs = [
        merk(feet.slice(0, 1024)),
        merk(feet.slice(1024, 2048)),
    ]
    let bigtock = [
        mash(roll(prevtack[0])),
        merk(ribs),
        extend(n2b(BigInt(57*2)), 7),
        h2b('00'.repeat(7))
    ] as Tock
    let firstbigtack = [
        bigtock,
        h2b('00'),
        ribs,
        feet.slice(0, 1024)
    ] as Tack
    let secondbigtack = [
        bigtock,
        h2b('01'),
        ribs,
        feet.slice(1024, 2048)
    ] as Tack

    out = djin.turn(memo_close([MemoType.SayTock, bigtock]))
    t.equal(memo_open(out)[0], MemoType.AskTack, `say/tocks big tack0 (init tock turn)`)
    out = djin.turn(memo_close([MemoType.SayTack, firstbigtack]))
    t.equal(memo_open(out)[0], MemoType.AskTicks, `say/tacks big tack0`)
    t.ok(true, `first tack`)
    out = djin.turn(memo_close([MemoType.SayTicks, ticks.slice(0, 1024)]))
    t.equal(memo_open(out)[0], MemoType.SayTicks, `say/ticks big ticks0`)

    out = djin.turn(memo_close([MemoType.SayTock, bigtock]))
    t.equal(memo_open(out)[0], MemoType.AskTack, `say/tocks big tack1 (init tock turn)`)
    out = djin.turn(memo_close([MemoType.SayTack, secondbigtack]))
    t.equal(memo_open(out)[0], MemoType.AskTicks, `say/tacks big tack1`)
    t.ok(true, `second tack ${rmap(out, b2h)}`)
    out = djin.turn(memo_close([MemoType.SayTicks, ticks.slice(1024, 2048)]))
    t.equal(memo_open(out)[0], MemoType.SayTicks, `say/ticks big ticks1`)

    out = djin.turn(memo_close([MemoType.SayTock, bigtock]))
    t.equal(memo_open(out)[0], MemoType.AskTock, `say/tocks big final vult`)

    t.ok(true, `first chunksize: ${firstbigtack[3].length}, second: ${secondbigtack[3].length}`)

    out = djin.turn(memo_close([MemoType.AskTack, [mash(roll(bigtock)), h2b('01')]]))
    let expected = memo_close([MemoType.SayTack, secondbigtack])
    t.ok(
        bleq(roll(out), roll(expected)),
        `ask/tacks big ${out[0][0]} ${expected[0][0]}`
    )
    djin.kill()
} catch(e) { console.log(e); t.ok(false, e.message); }})

const runcase = (dir, name, full=false) => {
    if (!name.endsWith('.jams')) return
    test(`${name}`, t => {
        debug(`TESTING: ${dir + name}`)
        let djin = new Djin('./test/db', true)
        let path = dir + name
        let file = readFileSync(path)
        let data = jams(file.toString())
        let out
        let prev
        for (let cmd of data) {
            let [func, memohex] = cmd
            let memo = rmap(memohex, h2b)
            if ('send' == func) {
                let memo = rmap(cmd[1], h2b)
                dbgmemo(memo_open(memo))
                let val
                try {
                    val = djin.turn(memo)
                } catch (e) {
                    console.error(e)
                    t.fail(e.message)
                    break
                }
                let out = memo_open(val)
                prev = val
                t.ok(true, `${name} send ${rmap(cmd[1], b2h)}`)
                continue
            }
            if ('want' == func) {
                debug(`want (actual=[${rmap(prev, b2h)}]) expected=[${cmd[1]}`)
                if (!bleq(roll(rmap(cmd[1], flatten)), roll(prev))) {
                    t.fail(`want fail expected=${cmd[1]} actual=${rmap(prev, b2h)}`)
                    break
                }
                continue
            }
            if ('note' == func) {
                debug(b2t(cmd[1]))
                continue
            }
            throw err(`unrecognized test command ${func}`)
        }
        djin.kill()
    })
}

test('djin jams', t=>{
    let dir = './test/case/djin/'
    let cases = readdirSync(dir)

    cases.forEach(c => runcase(dir, c))
})

//runcase('./test/case/djin/', 'djin_realtx_pvnotbest.jams')