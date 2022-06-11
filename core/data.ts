import {
    Blob, blob, roll, unroll,
    Okay, pass, fail, toss,
    Mesh, Mish, mesh, mish,
    Tick, Tock, Tack,
    Stat, Know, Snap,
    Bill, Bnum
} from './type'

export {
    Rock, Tree
}

class Rock {
    _db = {}
    // emptyblob-initialized
    _get(key :Blob) :Blob {
	let hkey = key.toString('hex')
	let hval = this._db[hkey]
	if (hval) return blob(hval)
	else return blob('')
    }
    // insert-only
    _set(key :Blob, val :Blob) {
	let hkey = key.toString('hex')
	let hval = val.toString('hex')
	let pval = this._db[hkey]
	if (pval != hval) {
	    toss(`panic: changing value of insert-only data`)
	} else {
	    this._db[hkey] = hval
	}
    }

    tick_add(tick :Tick) :Mesh {
	let val = roll(tick)
	let key = mesh(val)
	this._set(key, val)
	return key
    }
    tick_get(tish :Mesh) :Okay<Tick> {
	let val = this._get(tish)
	if (val.length)
	    return pass(unroll(val))
	else return fail(`no such tick`)
    }

    /*
      
    // tickhash -> tick
    tick_add(tick :Tick) :Mesh
    tick_get(tish :Mesh) :Tick

    // tockhash -> tock
    tock_add(tock :Tock) :Mesh
    tock_get(tosh :Mesh) :Tock

    // [tockhash,idx] -> tickhash
    tack_add(tack :Tack, indx :number) :Mesh
    tack_get(tosh :Mesh, indx :number) :Mesh

    */
}

class Tree {
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

