import {
    Okay, okay, toss, pass, fail, need, aver,
    Blob, Roll, islist, isblob, isroll,
    Tick, Tock, Tack, bleq, roll, b2h
} from './word.js'

export {
    form_tick,
    form_tack,
    form_tock,
}

function form_tock(x :Roll) :Okay<Tock> {
    aver(_=>isroll(x), `must be a roll`)
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

function form_tack(x :Roll) :Okay<Tack> {
    aver(_=>isroll(x), `must be a roll`)
    try {
        need(islist(x), `must be a list`)
        need(x.length == 4, `must be len 4`)
        let tock = x[0] as Roll
        let eye  = x[1] as Roll
        let ribs = x[2] as Roll
        let feet = x[3] as Roll
        need(okay(form_tock(tock)), `tack.tock is not well-formed`)
        need(isblob(eye), `eye must be a blob`)
        need(eye.length == 1, `eye must be a blob of len 1`)
        need(ribs.length <= 2**7, `ribs must have len <= 2^7`)
        need(ribs.every(isblob), `ribs must be a list of blobs`)
        need(ribs.every(b=>b.length == 24), `ribs must be list of hashes`)
        need(feet.every(isblob), `feet must be a list of blobs`)
        need(feet.every(b=>b.length == 24), `feet must be list of hashes`)
        need(feet.length <= 2**17, `feet must have len <= 2^17`)
        return pass(x)
        // merkle root checked in vinx_tack
    } catch (e) {
        return fail(e.message)
    }
}

function form_tick(x :Roll) :Okay<Tick> {
    aver(_=>isroll(x), `must be a roll`)
    try {
        need(islist(x), `must be a list`)
        need(x.length == 2, `must be len 2`)
        let moves = (x[0] as Roll)
        let ments = (x[1] as Roll)
        need(islist(moves), `moves must be a list`)
        need(islist(ments), `ments must be a list`)
        need(moves.length > 0 || ments.length > 0,
             `moves and ments must not both be empty`)
        need(moves.length <= 7, `moves must have len <= 7`)
        need(ments.length <= 7, `ments must have len <= 7`)
        for (let [moveidx, move] of moves.entries()) {
            need(islist(move), `move must be a list`)
            move = (move as Blob[])
            need(move.length == 3, `move must have len 3`)
            let [txin, indx, sign] = move;
            need(isblob(txin), `txin must be a blob`)
            need(isblob(indx), `indx must be a blob`)
            need(isblob(sign), `sign must be a blob`)
            need((txin as Blob).length == 24, `txin must be len 24`)
            need((indx as Blob).length ==  1, `indx must be len 1`)
            need((sign as Blob).length == 65, `sign must be len 65`)
            moves.forEach((m, idx) =>
                need(
                    idx == moveidx
                    || (!bleq(txin as Blob, m[0] as Blob) || !bleq(indx as Blob, m[1] as Blob)),
                    'moves can\'t have duplicate entries'
                )
            )
            let indxnum = Number(b2h(indx as Blob))
            need(indxnum <= 7, `indx must be <= 7`)
            need(indxnum != 7 || moves.length == 1, `len(moves) must be 1 if indx == 7`)
        }
        let totalcash = BigInt(0)
        let MAX_CASH  = BigInt(2) ** BigInt(53) - BigInt(1)
        for (let ment of ments) {
            need(islist(ment), `ment must be a list`)
            ment = (ment as Blob[])
            need(ment.length == 2, `ment must have len 2`)
            let [code, cash] = ment
            need(isblob(code), `code must be blob`)
            need(isblob(cash), `cash must be blob`)
            need((code as Blob).length == 20, `code must have len 20`)
            need((cash as Blob).length ==  7, `cash must have len 7`)
            const cashnum = BigInt('0x'+b2h(cash as Blob))
            totalcash += cashnum
            need(cashnum <= MAX_CASH, `cash must be <= 2^53-1`)
        }
        need(totalcash <= MAX_CASH, `sum of all cash in ments must be <= 2^53-1`)
        return pass(x as Tick)
    } catch (e) {
        return fail(e.message)
    }
}
