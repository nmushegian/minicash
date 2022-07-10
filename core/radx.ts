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
    Blob, roll,
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

// The first type node is called a Leaf.
// TODO: don't use RLP here, make it a flat buffer with fixed size slices
type Leaf = [
    Blob // tag (leaf == 00)
  , Blob // prefix
  , Blob // value
]
function leaf(prefix :Blob, value :Blob) :Leaf {
    return [h2b('00'), prefix, value]
}

// The second is called a limb. This node represents that there are multiple
// distinct keys whose prefix is equal to current search prefix, but different
// from that point forward.
// In this implementation the branching factor is 2.
// TODO: don't use RLP here, make it a flat buffer with fixed size slices
type Limb = [
    Blob // tag (leaf == 01)
  , Blob // prefix
  , Blob // left
  , Blob // right
]

class Twig {
    rite // the underlying rock dbtx
    diff // we don't push writes to db until end of tx, keep them cached
    snap // the snap this twig was initialized with respect to
    constructor(rite :Rite, snap :Snap) {
        this.rite = rite
        this.diff = new Map()
    }
    read(key :Blob) :Blob {
        if (this.diff.has(b2h(key))) {
            return this.diff.get(b2h(key))
        } else {
            return this._lookup(this.snap, key)
        }
    }
    etch(key :Blob, val :Blob) {
        if (this.diff.has(b2h(key))) {
            toss(`panic, modifying value already in tree: ${key}`)
        }
        this.diff.set(b2h(key), val)
    }
    _aloc(n : number) :Snap {
        let next = this.rite.read(t2b('aloc'))
        this.rite.etch(t2b('aloc'), extend(n2b(bnum(next) + BigInt(n)), 8))
        return next
    }
    _lookup(root :Snap, key :Blob) :Blob {
        throw err(`todo _lookup`)
    }
    _insert(root :Snap, key :Blob, val :Blob) :Snap {
        console.log(`inserting ${b2h(key)} : ${b2h(val)}`)
        throw err(`todo _insert`)
    }
}

class Tree {
    rock :Rock

    constructor(rock :Rock) {
        this.rock = rock
        let initleaf = [h2b('00'), h2b(''), h2b('')]
        this.rock.etch_one(h2b('00'.repeat(8)), roll(initleaf))
        this.rock.etch_one(t2b('aloc'), h2b('0000000000000001')) // 1
    }
    look(snap :Snap, look :((Rock,Twig) =>void)) {
        this.rock.rite(rite => {
            let twig = new Twig(rite, snap)
            look(this.rock, twig)
        })
    }
    grow(snap :Snap, grow :((Rock,Twig,Snap) => void)) {
        this.rock.rite(rite => {
            let twig = new Twig(rite, snap)
            // `grow` is given the snap that these changes will be saved as (`next`)
            // before the transaction is complete. That's because a reference
            // to this snap might need to be saved somewhere by the grow function.
            // Because the entire dbtx is atomic, this is fine.
            let next = twig._aloc(1)
            grow(rite, twig, next)
            // now twig has set of diffs
            // iterate through each and insert them into the prefix tree
            // then replace the last root with the same value but nodeID `next`
            let root = snap
            for (let [k, v] of twig.diff.entries()) {
                root = twig._insert(root, h2b(k), v)
            }
            // TODO replace root with `next`, return it
        })
    }

    // `snip` removes a snap from the tree, and garbage-collects
    // all internal nodes that no longer have references
    snip(snap :Snap) {
        toss(`todo snip`)
    }
}
