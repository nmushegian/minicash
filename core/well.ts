import {
    Okay, okay, toss, pass, fail, need, aver,
    Blob, Roll, islist, isblob, isroll,
    Tick, Tock, Tack
} from './word.js'

export {
    form_tick,
    form_tock,
    form_tack,
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
        need(x.length == 3, `must be len 3`)
        let tock = x[0] as Roll
        let neck = x[1] as Roll
        let feet = x[2] as Roll
        need(okay(form_tock(tock)), `tack.tock is not well-formed`)
        need(islist(neck), `neck must be a list`)
        need(neck.length <= 2**7, `neck must have len <= 2^7`)
        need(neck.every(isblob), `neck must be a list of blobs`)
        need(neck.every(b=>b.length == 24), `neck must be list of hashes`)
        need(islist(feet), `feet must be a list`)
        need(feet.every(isblob), `feet must be a list of blobs`)
        need(feet.every(b=>b.length == 24), `feet must be list of hashes`)
        need(feet.length <= 2**17, `feet must have len <= 2^17`)
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
        need(moves.length > 0 || moves.length > 0,
             `moves and ments must not both be empty`)
        need(moves.length <= 7, `moves must have len <= 7`)
        need(ments.length <= 7, `ments must have len <= 7`)
        for (let move of moves) {
            need(islist(move), `move must be a list`)
            move = (move as Blob[])
            need(move.length == 3, `move must have len 3`)
            let [txin, indx, sign] = move;
            need(isblob(txin), `txin must be a blob`)
            need(isblob(indx), `indx must be a blob`)
            need(isblob(sign), `sign must be a blob`)
            need((txin as Blob).length == 24, `txin must be len 24`)
            need((indx as Blob).length ==  1, `indx must be len 1`)
            need((sign as Blob).length == 32, `sign must be len 32, got ${sign.length}`)
        }
        for (let ment of ments) {
            need(islist(ment), `ment must be a list`)
            ment = (ment as Blob[])
            need(ment.length == 2, `ment must have len 2`)
            let [code, cash] = ment
            need(isblob(code), `code must be blob`)
            need(isblob(cash), `cash must be blob`)
            need((code as Blob).length == 20, `code must have len 20`)
            need((cash as Blob).length ==  7, `cash must have len 7`)
        }
        return pass(x as Tick)
    } catch (e) {
        return fail(e.message)
    }
}
