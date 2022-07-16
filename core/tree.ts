// pure map abstraction for per-branch items

import Debug from 'debug'
const dub = Debug('cash:tree')


import {
    Blob, bleq,
    Roll, roll, unroll, rmap,
    Snap,
    bnum,
    b2h, h2b, t2b, n2b,
    aver, need, toss, err,
    extend
} from './word.js'

import { Rock, Rite, rkey } from './rock.js'

export { Tree, Twig }

// The prefix tree has two kinds of internal nodes, they are keyed by an
// internal node ID, which also becomes the Snap when the trie root is updated.

// The first type node is called a Leaf. This node type means there is only
// one value with the given suffix from that point forward. The entire key
// is copied so that you can use a single leaf node for all branches,
// because otherwise you end up with many duplicates that differ by one byte,
// so it actually saves space to put the whole key.
type Leaf = [
    Blob // tag (leaf == 00)
  , Blob // key
  , Blob // val
]
function isleaf(item :Roll) :boolean {
    return bleq(item[0] as Blob, h2b('00'))
}
function make_leaf(key :Blob, val :Blob) :Leaf {
    return [h2b('00'), key, val]
}

// The second is called a limb. This node represents that there are multiple
// distinct keys whose prefix is equal to current search prefix, but different
// from that point forward.
// In this implementation the branching factor is 256.
// Note that this representation doesn't have a way to represent "no next byte",
// this still works because we know that all tree keys have the same length, so
// you will never have a key that is a prefix of another key.
// (TODO: As an easy hack to save some space the length of `subtrees` could be
// only as long as needed for the largest value.)
type Limb = [
    Blob   // tag (leaf == 01)
  , Snap[] // subtrees
]
function islimb(item :Roll) :boolean {
    return bleq(item[0] as Blob, h2b('01'))
}
function make_limb(subs :Snap[]) :Limb {
    return [h2b('01'), subs]
}
function show_limb(limb :Limb) { // debugging
    let obj = {}
    for (let [k,v] of Object.entries(limb[1])) {
        if (v.length != 0) {
            obj[b2h(Buffer.from([parseInt(k)]))] = b2h(v)
        }
    }
    return JSON.stringify(obj, null, 2)
}

class Twig {
    rite // the underlying rock dbtx
    diff // we don't push writes to db until end of tx, keep them cached
    snap // the snap this twig was initialized with respect to
    _keysize // aver / sanity check, can remove later
    constructor(rite :Rite, snap :Snap, _keysize :number = 29) {
        this.rite = rite
        this.diff = new Map()
        this.snap = snap
        this._keysize = _keysize
    }
    read(key :Blob) :Blob {
        aver(_=> key.length == this._keysize, `panic: twig.read bad key size`)
        if (this.diff.has(b2h(key))) {
            return this.diff.get(b2h(key))
        } else {
            return this._lookup(this.snap, key)
        }
    }
    etch(key :Blob, val :Blob) {
        aver(_=> key.length == this._keysize, `panic: twig.etch bad key size`)
        if (this.diff.has(b2h(key))) {
            toss(`panic, modifying value already in tree: ${b2h(key)}`)
        }
        this.diff.set(b2h(key), val)
    }
    _aloc(n : number = 1) :Snap {
        let next = this.rite.read(t2b('aloc'))
        this.rite.etch(t2b('aloc'), extend(n2b(bnum(next) + BigInt(n)), 8))
        return next
    }

    _lookup(snap :Snap, key :Blob, idx :number = 0) :Blob {
        aver(_=> key.length == this._keysize, `panic: twig._lookup bad key size`)
        // get item from rock
        let blob = this.rite.read(snap)
        aver(_=> blob.length > 0, `panic: no value for snap key ${snap}`)
        let item = unroll(blob)
        if (isleaf(item)) {
            let leaf = item as Leaf
            let leafkey = leaf[1]
            if (bleq(key, leafkey)) {
                return leaf[2]
            } else {
                return h2b('') // emptyblob initialized
            }
        } else if (islimb(item)) {
            let limb = item as Limb
            let nextbyte = key[idx]
            let nextsnap = limb[1][nextbyte]
            if (nextsnap.length == 0) {
                return h2b('') // emptyblob initialized
            } else {
                return this._lookup(nextsnap, key, idx + 1)
            }
        } else {
            throw err(`panic: unrecognized tree node type ${b2h(blob)}`)
        }
    }

    _insert(snap :Snap, key :Blob, val :Blob, idx :number = 0) :Snap {
        aver(_=> key.length == this._keysize, `panic: twig._lookup bad key size`)
        let blob = this.rite.read(snap)
        aver(_=> blob.length > 0, `panic: no value for snap key ${snap}`)
        let item = unroll(blob)
        if (isleaf(item)) {
            let oldleaf = item as Leaf
            let oldkey = oldleaf[1]
            aver(_=> !bleq(oldkey, key), `inserting duplicate key`)
            let oldbyte = oldkey[idx]
            let newbyte = key[idx]
            if (oldbyte == newbyte) {
                let subsnap = this._insert(snap, key, val, idx + 1)
                let newlimb = make_limb((new Array(256).fill(h2b(''))))
                newlimb[1][oldbyte] = subsnap
                let limbnode = this._aloc()
                this.rite.etch(limbnode, roll(newlimb))
                return limbnode
            } else {
                let newleaf = make_leaf(key, val)
                let leafnode = this._aloc()
                this.rite.etch(leafnode, roll(newleaf))
                let newlimb = make_limb((new Array(256)).fill(h2b('')))
                newlimb[1][oldbyte] = snap
                newlimb[1][newbyte] = leafnode
                let limbnode = this._aloc()
                this.rite.etch(limbnode, roll(newlimb))
                return limbnode
            }
        } else if (islimb(item)) {
            let limb = item as Limb
            let subs = limb[1]
            let byte = key[idx]
            let next = subs[byte]
            if (next.length == 0) {
                // no keys with this next byte -- add a leaf and put it there
                let newleaf = make_leaf(key, val)
                let leafnode = this._aloc()
                this.rite.etch(leafnode, roll(newleaf))
                let copysubs = []
                subs.forEach(x => copysubs.push(x))
                copysubs[byte] = leafnode
                let newlimb = make_limb(copysubs)
                let limbnode = this._aloc()
                this.rite.etch(limbnode, roll(newlimb))
                return limbnode
            } else {
                // one or more keys with this next byte -- insert into subtree
                // and return revised node
                let copysubs = []
                subs.forEach(x => copysubs.push(x))
                let subt = this._insert(next, key, val, idx + 1)
                copysubs[byte] = subt
                let newlimb = make_limb(copysubs)
                let limbnode = this._aloc()
                this.rite.etch(limbnode, roll(newlimb))
                return limbnode
            }
        } else {
            throw err(`panic: unrecognized internal node type for item ${item}`)
        }
        throw err(`panic: unreachable`)
    }

}

class Tree {
    rock :Rock
    keysize :number

    constructor(rock :Rock, reset=false, keysize = 29) {
        this.rock = rock
        this.keysize = keysize
        // initialize with dummy value 000... -> 00
        // make it the same key length as ment/pent keys because
        // that is an invariant for this simplified version
        if (reset) {
            let initleaf = [h2b('00'), h2b('00'.repeat(keysize)), h2b('00')]
            this.rock.etch_one(h2b('00'.repeat(8)), roll(initleaf))
            this.rock.etch_one(t2b('aloc'), h2b('0000000000000001')) // 1
        }
    }
    look(snap :Snap, look :((Rock,Twig) =>void)) {
        this.rock.rite(rite => {
            let twig = new Twig(rite, snap)
            look(this.rock, twig)
        })
    }
    grow(snap :Snap, grow :((Rock,Twig,Snap) => void)) :Snap {
        let next
        this.rock.rite(rite => {
            let twig = new Twig(rite, snap)
            // `grow` is given the snap that these changes will be saved as (`next`)
            // before the transaction is complete. That's because a reference
            // to this snap might need to be saved somewhere by the grow function.
            // Because the entire dbtx is atomic, this is fine.
            next = twig._aloc()
            grow(rite, twig, next)
            // now twig has set of diffs
            // iterate through each and insert them into the prefix tree
            // then replace the last root with the same value but nodeID `next`
            let root = snap
            for (let [k, v] of twig.diff.entries()) {
                root = twig._insert(root, h2b(k), v)
            }
            let lastnode = rite.read(root)
            rite.etch(next, lastnode)
        })
        return next
    }

    // `snip` removes a snap from the tree, and garbage-collects
    // all internal nodes that no longer have references
    snip(snap :Snap) {
        toss(`todo snip`)
    }
}
