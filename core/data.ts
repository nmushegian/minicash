import {
    Okay, Blob, Hash,
    Tick, Tock, Tack,
    Stat, Know, Snap
} from './type'

export {
    Glob, Tree, Desk
}

interface Glob {
    tick_add(tick :Tick) :Hash
    tick_get(tish :Hash) :Tick
    tock_add(tock :Tock) :Hash
    tock_get(tosh :Hash) :Tock
    tack_add(tack :Tack) :[Hash, number]
    tack_get(tash :Hash, indx :number) :Hash
}

interface Tree {
    // tockhash -> [tock,stat]
    thin_get(tosh :Hash) :Okay<[Tock,Stat]>;
    thin_add(tock :Tock);

    // tockhash -> PV | DV | PN | DN
    know_get(tosh :Hash) :Okay<Know>;
    know_set(tosh :Hash, know :Know);

    // tockhash -> snap
    full_add(tock :Tock, snap :Snap);
    full_get(tosh :Hash) :Okay<Snap>;
}

interface Desk {
    read(copy :Snap, key :Blob)
    edit(copy :Snap, editor :((desk:{
	get: (key :Blob) => Blob;
	set: (key :Blob, val :Blob) => void;
    }) => Snap))
}
