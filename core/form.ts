import {
    Okay, okay, toss, pass, fail, need,
    Blob, Roll,
    Tick, Tock,
    Move, Bill
} from './type.js'

export {
    tick_form,
    tock_form,
    move_form,
    bill_form
}

function islist(x :any) : boolean {
    return Array.isArray(x)
}

function isblob(x :any) : boolean {
    return Buffer.isBuffer(x)
}

function tock_form(x :Roll) :Okay<Tock> {
    try {
        need(islist(x), `not a list`)
	need(x.length == 4, `length is not 4`)
	for (let item of x) {
	    need(isblob(item), `item is not a blob`)
	}
	let [prev, root, time, fuzz] = x
	need((prev as Blob).length == 24, `prev must be len 24`)
	need((root as Blob).length == 24, `root must be len 24`)
	need((time as Blob).length ==  7, `time must be len 7`)
	need((fuzz as Blob).length ==  7, `fuzz must be len 7`)
	return pass(x as Tock)
    } catch (e) {
	return fail(e.message)
    }
}

function tick_form(x :Roll) :Okay<Tick> {
    try {
	need(islist(x), `not an array`)
	need(x.length == 2, `not len 2`)
	let moves = (x[0] as Roll)
	let bills = (x[1] as Roll)
	need(islist(moves), `moves must be a list`)
	need(islist(bills), `bills must be a list`)
	need(moves.length > 0 || bills.length > 0,
            `moves and bills both empty`)
	need(moves.length <= 7, `moves must have len <= 7`)
	need(bills.length <= 7, `bills must have len <= 7`)
	for (let move of moves) {
	    okay(move_form((move as Roll)))
	}
	for (let bill of bills) {
	    okay(bill_form((bill as Roll)))
	}
	return pass(x as Tick)
    } catch (e) {
	return fail(e.message)
    }
}

function move_form(x :Roll) :Okay<Move> {
    try {
	need(islist(x), `move must be a list`)
	need(x.length == 3, `move must have len 3`)
	let [txin, indx, sign] = x;
	need(isblob(txin), `txin must be a blob`)
	need(isblob(indx), `indx must be a blob`)
	need(isblob(sign), `sign must be a blob`)
	need((txin as Blob).length == 24, `txin must be len 24`)
	need((indx as Blob).length ==  1, `indx must be len 1`)
	need((sign as Blob).length == 32, `sign must be len 32`)
	return pass(x as Move)
    } catch (e) {
	return fail(e.message)
    }
}

function bill_form(x :Roll) :Okay<Bill> {
    try {
	need(islist(x), `bill must be a list`)
	need(x.length == 2, `bill must have len 2`)
	let [addr, cash] = x
	need(isblob(addr), `addr not a blob`)
	need(isblob(cash), `cash not a blob`)
	need((addr as Blob).length == 20, `addr must have len 20`)
	need((cash as Blob).length ==  7, `cash must have len 7`)
	return pass(x as Bill)
    } catch (e) {
	return fail(e.message)
    }

}
