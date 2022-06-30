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

test('pool', t => {
    let djin = new Djin('test/db', true, true)
    let keypair = ec.genKeyPair()
    let pubkey = b2h(Buffer.from(keypair.getPublic().encodeCompressed()))
    let pool = new Pool(djin, undefined, pubkey)
    pool.mine()

    /*
    setInterval(() => {
        pool.mine()
    }, 5000)

     */
})
