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
    Blob,
    Snap,
    h2b,
    aver, need, toss, err
} from './word.js'

import { Rock, Rite } from './rock.js'

// The prefix tree has three kinds of internal nodes, they are keyed by an
// internal node ID, which also becomes the Snap when the trie root is updated.

// The first type node is called a Leaf.
// The form of a leaf is `00 ++ value`.
type Leaf = Blob
function isleaf(b :Blob) :boolean {
    need(b.length == 9, `leaf must have length 9 (tag:1 + nodeID:8) (blob: ${b})`)
    throw err(`todo isleaf`)
}
function makeleaf(value :Blob) :Leaf {
    return Buffer.concat([h2b('00'), value])
}

// The second is called a dive. This node represents that there are multiple
// distinct keys whose prefix is equal to current search prefix, but different
// from that point forward.
// In this implementation the branching factor is 2.
// The form of a fork is `01 ++ leftID ++ rightID ++ prefix`, where leftID is the nodeID
// of subtree whose next bit is 0, and rightID is nodeID of subtree whose next bit is 1,
// and prefix is the part of the key shared by subtrees.
type Dive = Blob
function isdive(b :Blob) :boolean {
    throw err(`todo isdive`)
}
function makedive(l :Snap, r :Snap, pref :Blob) :Dive {
    return Buffer.concat([h2b('01'), l, r, pref])
}
function forkdive(d :Dive, pref :Blob) :Dive {
    throw err(`todo forkdive`)
}

class PrefTwig {
    rite // the underlying rock dbtx
    diff // we don't push writes to db until end of tx, keep them cached
    constructor(rite) {
        this.rite = rite
        this.diff = new Map()
    }
    read(k :Blob) :Blob {
        // check cache
        // then do lookup
        throw new Error('todo etch')
    }
    etch(k :Blob, v :Blob) {
        // if cached
        //   aver not changed
        // else
        //   aver not changed in db
        //   put in cache
        throw new Error('todo etch')
    }
}

class PrefTree {
    rock :Rock

    constructor(rock :Rock) {
        this.rock = rock
    }
    _aloc() :Snap {
        throw new Error('todo _aloc')
    }
    _look(k :Blob) :Blob {
        throw err(`todo _look`)
    }
    look(copy :Snap, look :((Rock,Twig) =>void)) {
        this.rock.rite(rite => {
            let twig = new PrefTwig(rite)
            look(this.rock, twig)
        })
    }
    grow(copy :Snap, grow :((Rock,Twig,Snap) => void)) {
        this.rock.rite(rite => {
            let twig = new PrefTwig(rite)
            // `grow` is given the snap that these changes will be saved as (`next`)
            // before the transaction is complete. That's because a reference
            // to this snap might need to be saved somewhere by the grow function.
            // Because the entire dbtx is atomic, this is fine.
            let next = this._aloc()
            grow(rite, twig, next)
            // now twig has set of diffs
            // iterate through each and insert them into the prefix tree
        })
    }
    // `snip` removes a snap from the tree, and garbage-collects
    // all internal nodes that no longer have references
    snip(snap :Snap) {
        toss(`todo snip`)
    }
}
