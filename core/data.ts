import {
    Okay, Blob,
    Mesh, Mish,
    Tick, Tock, Tack,
    Stat, Know, Snap,
    Bill, Bnum
} from './type'

export {
    Glob, Tree
}

interface Glob {
    tick_add(tick :Tick) :Mish
    tick_get(tish :Mish) :Tick
    tock_add(tock :Tock) :Mesh
    tock_get(tosh :Mesh) :Tock
    tack_add(tack :Tack) :[Mesh, number]
    tack_get(tash :Mesh, indx :number) :Mesh
}

interface Tree {
    // tockhash -> [tock,stat]
    thin_get(tosh :Mesh) :Okay<[Tock,Stat]>;
    thin_add(tock :Tock);

    // tockhash -> PV | DV | PN | DN
    know_get(tosh :Mesh) :Okay<Know>;
    know_set(tosh :Mesh, know :Know);

    // tockhash -> snap
    full_add(tock :Tock, snap :Snap);
    full_get(tosh :Mesh) :Okay<Snap>;

    // snap -> utxo -> [[hash,cash],burn]
    page_read(copy :Snap, key :Blob) :Okay<[Bill,Bnum]>;
    page_edit(copy :Snap, editor :((desk:{
	get: (key :Blob) => Blob;
	set: (key :Blob, val :Blob) => void;
    }) => Snap))
}

