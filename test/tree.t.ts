import { test } from 'tapzero'

import { randomBytes } from 'crypto'

import {
    roll,
    okay,
    h2b, b2h, t2b, bleq,
    Snap
} from '../core/word.js'

import { Rock, rkey } from '../core/rock.js'
import { Tree } from '../core/tree.js'

test('tree', t=>{
    let rock = new Rock('test/db', true)
    let tree = new Tree(rock, true)

    // initialized with dummy entry "00"x29 -> "00", next snap is 1
    let zero = h2b('00'.repeat(8))
    let init = rock.read_one(zero)
    t.deepEqual(init, roll([h2b('00'), h2b('00'.repeat(29)), h2b('00')]))
    let next = rock.read_one(t2b('aloc'))
    let one = h2b('00'.repeat(7) + '01')
    t.deepEqual(next, one)

    let key1 = h2b('01'.repeat(29))
    let inner // to check the snap given in grow function equals returned snap
    let snap1 = tree.grow(zero, (rock, twig, snap) => {
        t.deepEqual(snap, one)
        twig.etch(key1, h2b('aa'))
        let aa = twig.read(key1) // check value is cached
        t.deepEqual(aa, h2b('aa'))

        inner = snap
    })
    t.deepEqual(inner, snap1)
    console.log('snap1', snap1)

    tree.look(snap1, (rock, twig) => {
        let val1 = twig.read(key1)
        t.deepEqual(val1, h2b('aa'))
    })

    console.log('========')
    let key2 = h2b('0101' + '00'.repeat(27))
    let snap2 = tree.grow(snap1, (rock, twig, snap) => {
        // same first 2 bytes as prior entry, then different
        twig.etch(key2, h2b('bb'))
        let bb = twig.read(key2)
        t.deepEqual(bb, h2b('bb'))

        let aa = twig.read(key1)
        t.deepEqual(aa, h2b('aa'))
    })

    // look back at snap1, new value shouldn't be present, old value should
    tree.look(snap1, (rock, twig) => {
        let aa = twig.read(key1)
        t.deepEqual(aa, h2b('aa'))

        let no = twig.read(key2)
        t.deepEqual(no, h2b(''))
    })
    rock.shut()
})

test('tree2', t=>{
    let rock = new Rock('test/db', true)
    let tree = new Tree(rock, true)

    let snap0 = h2b('00'.repeat(8))

    let set1 = {}
    let set2 = {}
    for (let i = 0; i < 10; i++) {
        let k1 = randomBytes(tree.keysize)
        let v1 = randomBytes(12)
        set1[b2h(k1)] = v1

        let k2 = randomBytes(tree.keysize)
        let v2 = randomBytes(12)
        set2[b2h(k2)] = v2
    }

    let inner1 // sanity check
    let snap1 = tree.grow(snap0, (rock, twig, snap) => {
        inner1 = snap
        for (let [k,v] of Object.entries(set1)) {
            twig.etch(h2b(k), v)
        }
    })
    t.deepEqual(inner1, snap1)
    tree.look(snap1, (rock, twig) => {
        for (let [k, v] of Object.entries(set1)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
    })

    let snap2 = tree.grow(snap1, (rock, twig, snap) => {
        for (let [k, v] of Object.entries(set2)) {
            twig.etch(h2b(k), v)
        }
    })

    tree.look(snap2, (rock, twig) => {
        for (let [k, v] of Object.entries(set2)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
    })

    // snap1 has all originals, but none of the new ones
    tree.look(snap1, (rock, twig) => {
        for (let [k, v] of Object.entries(set1)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
        for (let [k, v] of Object.entries(set2)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, h2b(''))
        }
    })

    rock.shut()
})

test('tree3', t=>{
    let rock = new Rock('test/db', true)
    let tree = new Tree(rock, true)

    let snap0 = h2b('00'.repeat(8))

    t.equal(29, tree.keysize) // fix test when change this
    let set1 = {
        '9197e5a8d3760280fac0b288d73c415f10e862fc07c1f9dfb5dac3063c':
          'd092c45bd0a79f2dece361f4',
        '915ba5443d816374cd2eefe546c3b4a8c4765f4ab0a08ad2a1a7cbbd80':
          '399b83f5595e51aa828bc1ed',
    }
    console.log('inserting set1', set1)
    let snap1 = tree.grow(snap0, (rock,twig,snap) => {
        for (let [k,v] of Object.entries(set1)) {
            twig.etch(h2b(k), h2b(v))
        }
    })

    tree.look(snap1, (rock,twig) => {
        for (let [k,v] of Object.entries(set1)) {
            let dbv = twig.read(h2b(k))
            t.equal(b2h(dbv), v)
        }
    })

    rock.shut()


        /*
    691edf2cd9b9eb6e5e0625ad840a5b4d55a31d188240a7778cb50ca01b a6bac3d17737e53578ae4405

    0ef1d80b8fb222948a6cfe6c9f281c612e3f23d3e5d097d9938a42ca02 c264fa70b1a29fd01b7a6204
    e46aea12389f5c679d58d2b2c8ca015ffc6fdc74f07240489783b31699 1602b3cefa329207fb75ca7a
    a5ec27c91e248a0232ce5d0341a00c37892587c03394d031f17ef7497b 1b4fb72559ea63f577bc4358
    3af2bfe1a116594c3877dc6fd88837b53da698ff953c22ef35dab62d40 2a8cf4860cbcd6fc990ff6c5
    6b0804cc197405d15a225b9138c61f2c498aa9dec94591536fbf6540fd 692a7b33226eecddc4d82aa2
    eea29bb6c087bd1b7785ff24ea08402450334c407e61e4ed2b4586171e c51bcf99ab0fb20cd5e2c53f
    d9d5f255cfb4b66a224e5f942caa91a631bcd0abe8ea2fd00d801369bb 4df62c9d6a1826147fb6fcdb

    */
})
