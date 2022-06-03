// engine


class Djin {
    best : any // best global desk from tree
    tree : any // head -> desk            // one `desk` view per tock, functional map
    //  stat  : [work left mint]
    //  know  : PV | PN | DV | DN         // state of knowledge of block validity
    //  bills : rtxi -> [hash cash burn]  // burn is expiry time
    //    not necessary, but useful:
    //  ticks : tickhash -> tockhash      // early dup check
    //  tocks : tockhash -> height        // faster common ancestor

    glob = {
        ticks: {} // content-addressed
      , tocks: {} // content-addressed
      , tacks: {} // almost-content-addressed, part of tockhash
    }

    turn(mail:any) : any[] {
        return []
    }
}