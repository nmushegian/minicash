// state transition
// we keep track of a tree of headers and thin state
//   thin state is immutable except for `know`, which can invalidate a tock
//   this immutable state tree is represented directly in our Tree
// we also keep track of a full state of unspent UTXOs
//   full state is immutable
//   it is represented with a pure map, we store snaps per tock in Tree

import {
  Okay, pass, fail
} from 'coreword'

import {
  Stat, Know,
  Tick, Tock,
  Tree, Desk,
} from './type.js'

export {
  vult_thin,
  vult_full
}

// only `desk` is represented as immutable set, one snap at each tock
// the rest are insert-only values, except `know` can have one-way
// transition from possibly-* to definitly-*

// !mutates tree:
//   insert stat
//   insert know = PV
function vult_thin(tree:Tree, tock:Tock) :Okay<Stat> {
  return fail(`todo`)
}

// !warn: returns [true, "DN"]  if "definitely invalid" -- NOT a fail
// !mutates tree:
//   insert desk snap
//   update know
function vult_full(tree:Tree, tock:Tock, ticks :Tick[]) :Okay<Know> {
  return fail(`todo`)
}
