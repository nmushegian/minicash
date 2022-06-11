import {
    Okay, Blob, Mash,
    Tick, Tock, Tack,
    Stat, Know, Snap,
    Bill, Bnum
} from './type'

export {
    Glob, Tree
}

interface Glob {
    tick_add(tick :Tick) :Mash
    tick_get(tish :Mash) :Tick
    tock_add(tock :Tock) :Mash
    tock_get(tosh :Mash) :Tock
    tack_add(tack :Tack) :[Mash, number]
    tack_get(tash :Mash, indx :number) :Mash
}

interface Tree {
    // tockhash -> [tock,stat]
    thin_get(tosh :Mash) :Okay<[Tock,Stat]>;
    thin_add(tock :Tock);

    // tockhash -> PV | DV | PN | DN
    know_get(tosh :Mash) :Okay<Know>;
    know_set(tosh :Mash, know :Know);

    // tockhash -> snap
    full_add(tock :Tock, snap :Snap);
    full_get(tosh :Mash) :Okay<Snap>;

    // snap -> utxo -> [[hash,cash],burn]
    page_read(copy :Snap, key :Blob) :Okay<[Bill,Bnum]>;
    page_edit(copy :Snap, editor :((desk:{
	get: (key :Blob) => Blob;
	set: (key :Blob, val :Blob) => void;
    }) => Snap))
}

