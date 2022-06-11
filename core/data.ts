import {
    Okay, Blob, Hash,
    Tick, Tock, Tack,
    Stat, Know, Snap
} from './type'

export {
    Glob, Tree, Desk
}

interface Glob {
    ticks: {
	add(tick :Tick) :Hash,
	get(tish :Hash) :Tick
    },
    tocks: {
	add(tock :Tock) :Hash,
	get(tosh :Hash) :Tock
    },
    tacks: {
	add(tack :Tack) :[Hash, number]
	get(tash :Hash, indx :number) :Hash
    }
}

interface Tree {
    // tockhash -> [tock,stat,know,snap?]
    read(tosh :Hash) : [Tock,Stat,Know,Snap?];
    // !warn,  [true, [_, 'DN']]  is a success result
    //    which signifies a tock that is inserted and marked invalid
    add_tock(tock :Tock) : Okay<[Stat,Know]>;
    set_know(tosh :Hash, know:Know);
    set_snap(tosh :Hash, know:Know);
}

interface Desk {
    edit( copy :Snap, save :Snap
	  , editor :(({get,set}) => void) )
    read( copy :Snap, key :Blob )
}
