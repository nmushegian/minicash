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

/*
test('djin', t=>{ try {
    let djin = new Djin('test/db', true)
    let out
    out = okay(djin.turn(memo(MemoType.AskTocks, mash(roll(djin.bang)))))
    t.deepEqual(out, memo_close([MemoType.Err, ['unavailable', mash(roll(djin.bang))]]))

    let tick1 = [[
        [] // no moves
    ],[
        [h2b('00'.repeat(20)), h2b('00'.repeat(7))] // 1 ment with miner reward
    ]]

    let tack1 = [
        undefined, // head
        [], // eyes
        [merk([mash(roll(tick1 as Tick))])],
        [tick1],
    ]

    let tock1 = [
        mash(roll(djin.bang)),
        merk([mash(roll(tick1 as Tick))]),
        h2b('00'.repeat(6) + '39'), // 57 in hex
        h2b('ff'.repeat(7))
    ]

    tack1[0] = tock1

    // give to djin
    out = okay(djin.turn(memo(MemoType.SayTocks, [tock1])))
    // djin asks for tack

    t.deepEqual(out, memo(MemoType.AskTocks, mash(roll(tock1))))
    djin.kill()

    djin = new Djin('./test/db', true, true)
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
    okay(djin.turn(memo_close([MemoType.SayTicks, [prevmint]])))
    okay(djin.turn(memo_close([MemoType.SayTacks, [prevtack]])))

    let ticks = maketicks(mash(roll(prevmint)), bnum(h2b('100000000')), 3075)
    let mint = [
        [[mash(roll(prevtack[0])), h2b('07'), h2b('00'.repeat(65))]],
        [[h2b('11'.repeat(20)), h2b('000000fffff800')]]
    ] as Tick
    ticks.push(mint)
    let feet  = ticks.map(t => mash(roll(t)))

    let ribs = [
        merk(feet.slice(0, 1024)),
        merk(feet.slice(1024, 2048)),
        merk(feet.slice(2048, 3072)),
        merk(feet.slice(3072, 4096))
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
        feet.slice(0, 2048)
    ] as Tack
    let secondbigtack = [
        bigtock,
        h2b('02'),
        ribs,
        feet.slice(2048, 4096)
    ] as Tack
    out = okay(djin.turn(memo_close([MemoType.SayTacks, [firstbigtack]])))
    need(memo_open(out)[0] != MemoType.Err, 'say/tacks big chunks chunk0,1 returned error')
    out = okay(djin.turn(memo_close([MemoType.SayTacks, [secondbigtack]])))
    need(memo_open(out)[0] != MemoType.Err, 'say/tacks big chunks chunk2,3 returned error')
    ticks.forEach(t => {
        out = okay(djin.turn(memo_close([MemoType.SayTicks, [t]])))
        need(memo_open(out)[0] != MemoType.Err, `say/ticks big chunks error ${rmap(t, b2h)}`)
    })
    out = okay(djin.turn(memo_close([MemoType.SayTocks, [bigtock]])))
    need(memo_open(out)[0] != MemoType.Err, `say/tocks big chunks error ${rmap(bigtock, b2h)}`)
    let expected = memo_close([MemoType.AskTocks, mash(roll(bigtock))])
    t.ok(
        bleq(roll(out), roll(expected)),
        `vulted a whole tock w/ big chunks act: ${rmap(out, b2h)} exp: ${rmap(expected, b2h)}`
    )
    t.ok(true, `first chunksize: ${firstbigtack[3].length}, second: ${secondbigtack[3].length}`)

    out = okay(djin.turn(memo_close([MemoType.AskTacks, mash(roll(bigtock))])))
    expected = memo_close([MemoType.SayTacks, [firstbigtack, secondbigtack]])
    t.ok(
        bleq(roll(out), roll(expected)),
        `ask/tacks big chunks ${out[0][0]} ${expected[0][0]}`
    )
    djin.kill()
} catch(e) { console.log(e); t.ok(false, e.message); }})

 */

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
                let val = djin.turn(memo)
                let out = memo_open(val)
                prev = val
                t.ok(true, `${name} send ${rmap(cmd[1], b2h)}`)
                continue
            }
            if ('want' == func) {
                debug(`want (actual=[${rmap(prev, b2h)}]) expected=[${cmd[1]}`)
                debug(bleq(roll(rmap(cmd[1], flatten)), roll(prev)))
                if (!bleq(roll(rmap(cmd[1], flatten)), roll(prev))) {
                    t.fail(`want fail expected=${cmd[1]} actual=${rmap(prev, b2h)}`)
                    break
                }
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

//runcase('./test/case/djin/', 'djin_realtx_dubspenddifftock_DVsibling.jams')