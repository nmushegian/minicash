import { test } from 'tapzero'
import { jams } from 'jams.js'

import {Dmon} from '../core/dmon.js'
import elliptic from 'elliptic'
const ec = elliptic.ec('secp256k1')


import Debug from 'debug'
import {b2h, h2b, t2b} from "../core/word.js";
const debug = Debug('dmon::test')
const keys = {
    ali: 'e4c90c881b372adf66e8f566de63f560f48ef16a31c2aef9b860023ff9ab634f',
    bob: '9f092b266aec975d0d75fb1046ab8986262659fb88521a22500a92498780dce0',
    cat: '1d4d8c560879214483c8645fe4b60d0fb72033c0591716c7af2df787823cf3b7',
}


test.only('dmon', async t => {
    let [ALI, BOB, CAT] = ['ali', 'bob', 'cat']
        .map(name =>
            b2h(t2b(ec.keyFromPrivate(h2b(keys[name])).getPublic().encodeCompressed()))
        )
    let ali = new Dmon()
    let bob = new Dmon()
    let epoch = Date.now()
    ali.init('./test/dbali', 10334, ALI, ['127.0.0.1:10335'], epoch, 57000, 200)
    //bob.init('./test/dbbob', 10335, BOB, ['127.0.0.1:10334'])

    //bob.play()
    await ali.play()


})