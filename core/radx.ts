

import {
    Blob,
    Snap,
    toss, aver,
} from './word.js'


class Twig {
    rite // the underlying rock dbtx
    cach // we don't push writes to db until end of tx, keep them cached
    done // just for safety (don't save reference to twig outside of tree.grow)
    constructor(rite) {
        _rite = rite
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
    // _seal is called by Tree after returning from `grow`. You
    // could call it early, which will prevent further writes,
    // but _seal is *not* the commit, that is done in `grow` by Tree.
    _seal() {
        // for each kv in cach
        // insert it
    }
}

class Tree {
    rock :Rock

    constructor(rock :Rock) {
    }

    look() {}
    grow() {}
    // `snip` removes a snap from the tree, and garbage-collects
    // all internal nodes that no longer have references
    snip(snap :Snap) {
        toss(`todo snip`)
    }
}
