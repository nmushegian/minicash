// pure state tree

// This level of abstraction deals with the user's view of the state at each snapshot.
// In other words, when we switch branches due to reorg, it just "checks out"
// the other state, rather than having to undo transactions.

// This file implements a simple patricia trie to present a pure kvdb view of state.
// This is pretty close to what we want in terms of time complexity, but using an
// adaptive radix trie would make this substantially more space-efficient.

// A twig is a database transaction over Tree, similar to how
// rite is a database transaction over Rock. In both cases, they
// are distinct concepts from a minicash transaction, called a tick.
// A twig is distinct from a rite because it manages a "virtual" mutable view
// of an underlying immutable map. Remember a tree is a layer of abstraction over a rock
// for some parts of the databse. A twig uses a single rite, but a single
// twig.grow(...) generates multiple rite.read(...) and rite.etch(...)
// because it traverses and updates the trie used to represent the tree.

// Recall these are the "rock" state, the parts that are content-addressed or
// pseudo-content-addressed, it is insert-only and each key can only have one possible value
// (with the exception of "best", which only changes when a new tock has higher total work).

// Rock:
//    ['tick', tickhash]         -> tick
//    ['tack', tockhash, i]      -> tack
//    ['tock', tockhash]         -> tock
//    ['work', tockhash]         -> work  // cumulative work
//    ['fold', tockhash, i]      -> fold  // [snap, fees]  partial utxo / fees
//    ['know', tockhash]         -> know  // validity state
//    ['best']                   -> tock

// This leaves the "tree" state, the parts of the state that are defined with respect
// to a particular snap.

// Tree:
//    [(snap) 'ment', mark]      -> ment  // utxo put [code, cash]
//    [(snap) 'pent', mark]      -> pent  // utxo use [tish, tosh] (by tick, in tock)
//    [(snap) 'pyre', mark]      -> time  // utxo expires

import {
    Blob, bleq,
    Roll, roll, unroll,
    Snap,
    bnum,
    b2h, h2b, t2b, n2b,
    aver, need, toss, err,
    extend
} from './word.js'

import { Rock, Rite } from './rock.js'

export { Tree, Twig }

// The prefix tree has two kinds of internal nodes, they are keyed by an
// internal node ID, which also becomes the Snap when the trie root is updated.

// The first type node is called a Leaf. This node type means there is only
// one value with the given suffix from that point forward. The entire key
// is copied because otherwise you end up with many duplicates that differ by
// just one byte, it ends up saving space.
// TODO: don't use RLP here, just slice a buffer
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
// In this implementation the branching factor is 256. As a hack to save some space
// the length of `subtrees` is only as long as needed for the largest value (TODO).
// Note that this representation doesn't have a way to represent "no next byte",
// this still works because we know that all tree keys have the same length, so
// you will never have a key that is a prefix of another key.
// TODO: don't use RLP here, just slice a buffer
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

class Twig {
    rite // the underlying rock dbtx
    diff // we don't push writes to db until end of tx, keep them cached
    snap // the snap this twig was initialized with respect to
    constructor(rite :Rite, snap :Snap) {
        console.log('twig init with snap', snap)
        this.rite = rite
        this.diff = new Map()
        this.snap = snap
    }
    read(key :Blob) :Blob {
        console.log('twig.read key', key)
        if (this.diff.has(b2h(key))) {
            console.log('cached in diff')
            return this.diff.get(b2h(key))
        } else {
            console.log('not cached, looking up')
            return this._lookup(this.snap, key)
        }
    }
    etch(key :Blob, val :Blob) {
        if (this.diff.has(b2h(key))) {
            toss(`panic, modifying value already in tree: ${key}`)
        }
        this.diff.set(b2h(key), val)
    }
    _aloc(n : number = 1) :Snap {
        let next = this.rite.read(t2b('aloc'))
        this.rite.etch(t2b('aloc'), extend(n2b(bnum(next) + BigInt(n)), 8))
        return next
    }

    _lookup(snap :Snap, key :Blob, idx :number = 0) :Blob {
        console.log('twig._lookup (snap key idx)', snap, key, idx)
        // get item from rock
        let blob = this.rite.read(snap)
        aver(_=> blob.length > 0, `panic: no value for snap key ${snap}`)
        let item = unroll(blob)
        console.log('item exists and unrolled')
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
            throw err(`panic: unrecognized tree node type`)
        }
    }

    _insert(snap :Snap, key :Blob, val :Blob, idx :number = 0) :Snap {
        console.log(`inserting ${b2h(key)} : ${b2h(val)}`)
        console.log(`looking up snap`, snap)
        let blob = this.rite.read(snap)
        aver(_=> blob.length > 0, `panic: no value for snap key ${snap}`)
        let item = unroll(blob)
        console.log(`got item`, item)
        if (isleaf(item)) {
            let oldleaf = item as Leaf
            console.log(`it's a leaf`)
            let oldkey = oldleaf[1]
            aver(_=> !bleq(oldkey, key), `inserting duplicate key`)
            let oldbyte = oldkey[idx]
            let newbyte = key[idx]
            console.log('oldbyte', oldbyte)
            console.log('newbyte', newbyte)
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

//                console.log('new leaf', newleaf)
//                console.log('new limb', newlimb)

                return limbnode
            }

        } else if (islimb(item)) {
            console.log(`it's a limb`)
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
                // one or more keys with this next byte -- recurse
                return this._insert(next, key, val, idx + 1)
            }
        } else {
            throw err(`panic: unrecognized internal node type for item ${item}`)
        }
        throw err(`panic: unreachable`)
    }

}

class Tree {
    rock :Rock

    constructor(rock :Rock) {
        this.rock = rock
        // initialize with dummy value 000... -> 00
        // make it the same key length as ment/pent keys because
        // that is an invariant for this simplified version
        let initleaf = [h2b('00'), h2b('00'.repeat(25)), h2b('00')]
        this.rock.etch_one(h2b('00'.repeat(8)), roll(initleaf))
        this.rock.etch_one(t2b('aloc'), h2b('0000000000000001')) // 1
    }
    look(snap :Snap, look :((Rock,Twig) =>void)) {
        console.log(`tree.look snap`, snap)
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
            next = twig._aloc(1)
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
