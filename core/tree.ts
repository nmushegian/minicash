// pure kvdb, parallel read / non-blocking write (mutable handles)

import {
    Rock
} from './rock.js'

export {
    Tree
}


class Tree {
    // tree grows on a rock, but we try not to think about that
    rock = new Rock()

    /*
// ['thin', tockhash] -> [tock,stat]
    thin_get(tosh :Mesh) :Okay<[Tock,Stat]>;
    thin_add(tock :Tock);

    // ['know', tockhash] -> PV | DV | PN | DN
    know_get(tosh :Mesh) :Okay<Know>;
    know_set(tosh :Mesh, know :Know);

    // ['snap', tockhash] -> snap
    full_add(tock :Tock, snap :Snap);
    full_get(tosh :Mesh) :Okay<Snap>;

    // snap -> utxo -> [[hash,cash],burn]
    page_read(copy :Snap, key :Blob) :Okay<[Bill,Bnum]>;
    page_edit(copy :Snap, editor :((desk:{
	get: (key :Blob) => Blob;
	set: (key :Blob, val :Blob) => void;
    }) => Snap))
    */
    //  not necessary, but useful -- info *about this branch*
    //  page_ticks : tickhash -> tockhash  // early dup check
    //  page_tocks : tockhash -> height    // faster common ancestor

}

