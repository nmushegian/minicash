import { test } from 'tapzero'
import { jams } from 'jams.js'

import {Djin} from '../core/djin.js'
import {Pool} from '../core/pool.js'

import Debug from 'debug'
const debug = Debug('pool::test')

import elliptic from 'elliptic'
const ec = elliptic.ec('secp256k1')

import {
    Tick,
    okay,
    roll, h2b,
    mash, memo, merk, MemoType,
    need, rmap, memo_open, bleq, b2h, t2b
} from '../core/word.js'
import {readdirSync, readFileSync} from "fs";
import {dbgtick} from "./helpers.js";

const keys = {
    ali: 'e4c90c881b372adf66e8f566de63f560f48ef16a31c2aef9b860023ff9ab634f',
    bob: '9f092b266aec975d0d75fb1046ab8986262659fb88521a22500a92498780dce0',
    cat: '1d4d8c560879214483c8645fe4b60d0fb72033c0591716c7af2df787823cf3b7',
}


test('pool', t => {
    let [ALI, BOB, CAT] = ['ali', 'bob', 'cat']
        .map(name =>
            b2h(t2b(ec.keyFromPrivate(h2b(keys[name])).getPublic().encodeCompressed()))
        )
    let djin = new Djin('test/db', true, true)
    let keypair = ec.genKeyPair()
    let pubkey = b2h(Buffer.from(keypair.getPublic().encodeCompressed()))
    let pool = new Pool(djin, undefined, ALI)
    let minthash = pool.mine()
    let alitobobhash = pool.send([[minthash, BigInt(0), BOB, BigInt(1)]], keys.ali)
    pool.mine()
    let bobtocat = pool.send([[alitobobhash, BigInt(0), CAT, BigInt(1)]], keys.bob)
    let last = pool.mine()
    t.ok(true, `mined a block! ${last}`)

    /*
    setInterval(() => {
        pool.mine()
    }, 5000)

     */
})
