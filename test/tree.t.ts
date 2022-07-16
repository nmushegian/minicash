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
    let set3 = {}
    for (let i = 0; i < 10; i++) {
        let k1 = randomBytes(tree.keysize)
        let v1 = randomBytes(12)
        set1[b2h(k1)] = v1

        let k2 = randomBytes(tree.keysize)
        let v2 = randomBytes(12)
        set2[b2h(k2)] = v2

        let k3 = randomBytes(tree.keysize)
        let v3 = randomBytes(12)
        set3[b2h(k3)] = v3
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

    // snap2 has set1 and set2
    tree.look(snap2, (rock, twig) => {
        for (let [k, v] of Object.entries(set1)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
        for (let [k, v] of Object.entries(set2)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
    })

    // snap1 has set1, and not set2
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

    let snap3 = tree.grow(snap2, (rock, twig, snap) => {
        for (let [k, v] of Object.entries(set3)) {
            twig.etch(h2b(k), v)
        }
    })

    // snap3 has set1, set2, and set3
    tree.look(snap3, (rock, twig) => {
        for (let [k, v] of Object.entries(set1)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
        for (let [k, v] of Object.entries(set2)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
        for (let [k, v] of Object.entries(set3)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
    })

    // snap1 has set1, and not set2 or set3
    tree.look(snap1, (rock, twig) => {
        for (let [k, v] of Object.entries(set1)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
        for (let [k, v] of Object.entries(set2)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, h2b(''))
        }
        for (let [k, v] of Object.entries(set3)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, h2b(''))
        }
    })

    // snap2 has set1 and set2, but not set3
    tree.look(snap2, (rock, twig) => {
        for (let [k, v] of Object.entries(set1)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
        for (let [k, v] of Object.entries(set2)) {
            let got = twig.read(h2b(k))
            t.deepEqual(got, v)
        }
        for (let [k, v] of Object.entries(set3)) {
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

})

test('tree4', t=> {
    let rock = new Rock('test/db', true)
    let tree = new Tree(rock, true)

    let snap0 = h2b('00'.repeat(8))

    let snap1 = tree.grow(snap0, (rock,twig,snap)=> {
        twig.etch(h2b('11'.repeat(tree.keysize)), h2b('10'))
    })

    let snap2A = tree.grow(snap1, (rock,twig,snap)=> {
        twig.etch(h2b('22'.repeat(tree.keysize)), h2b('2a'))
    })

    let snap2B = tree.grow(snap1, (rock,twig,snap)=> {
        twig.etch(h2b('22'.repeat(tree.keysize)), h2b('2b'))
    })

    tree.look(snap2A, (rock,twig) => {
        let val = twig.read(h2b('22'.repeat(tree.keysize)))
        t.deepEqual(val, h2b('2a'))
    })

    tree.look(snap2B, (rock,twig) => {
        let val = twig.read(h2b('22'.repeat(tree.keysize)))
        t.deepEqual(val, h2b('2b'))
    })

    rock.shut()
})
