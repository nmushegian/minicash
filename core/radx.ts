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

// The second is called a limb. This node represents that there are multiple
// distinct keys whose prefix is equal to current search prefix, but different
// from that point forward.
// In this implementation the branching factor is 256. As a hack to save some space
// the length of `subtrees` is only as long as needed for the largest value.
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

    _lookup(root :Snap, key :Blob, idx :number = 0) :Blob {
        let snap = root
        // get item from rock
        let blob = this.rite.read(snap)
        aver(_=> blob.length > 0, `panic: no value for snap key ${snap}`)
        let item = unroll(blob)
        console.log(item)
        if (isleaf(item)) {
            // compare suffix
            // if equal, return it
            // else return emptyblob
            throw err(`todo lookup isleaf`)
        } else if (islimb(item)) {
            // if limb key is too long, return empty
            // if subkeys don't match, return empty
            // else
            //   branches = item[2]
            //   nextbyte = key[idx]
            //   snap = branches[nextbyte]
            //   if snap is empty, return empty
            //   else
            //     return this._lookup(snap, key, idx + 1)
            throw err(`todo lookup islimb`)
        } else {
            throw err(`panic: unrecognized tree node type`)
        }
    }

    _insert(root :Snap, key :Blob, val :Blob, idx :number = 0) :Snap {
        console.log(`inserting ${b2h(key)} : ${b2h(val)}`)
        let snap = root
        console.log(`looking up snap`, snap)
        let blob = this.rite.read(snap)
        aver(_=> blob.length > 0, `panic: no value for snap key ${snap}`)
        let item = unroll(blob)
        console.log(`got item`, item)
        if (isleaf(item)) {
            console.log(`it's a leaf`)
            // add a new leaf
            // create new limb pointing to new leaf and old leaf
            // return the new limb
        } else if (islimb(item)) {
            console.log(`it's a limb`)
            // add a new leaf
            // copy old limb to new limb
            // get snap for the next byte
            // if it doesn't exist, set it in the new limb
            // if it does, get new subroot = _insert(snap, key, val, idx + 1)
            //   and set it in the new limb
            // return the new limb
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
        // represents "" -> ""
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
            // TODO replace root with `next`, return it
        })
        return next
    }

    // `snip` removes a snap from the tree, and garbage-collects
    // all internal nodes that no longer have references
    snip(snap :Snap) {
        toss(`todo snip`)
    }
}
