/******************************************************************************
**    MAGIC CIRCLE RPC PROTOCOL
**
**   The interfaces in this file describe the RPC protocol used to communicate
** between the Magic Circle dispatcher and ingestion servers. This is the most
** up to date and authoritative documentation for how all this stuff works so
** give it a scroll. If you have any questions please contact me on the Owlbear
** discord. - snail
**
**
**   Each interface has some notes on its semantics, here's a key for them:
** - (client -> server): Sent from the dispatcher to your server.
** - (client <- server): Magic Circle is prepared to receive this.
** - (reply expected): Whichever endpoint receives this RPC should reply.
**                     (at the moment, replies are only needed for (c<-s) RPCs)
** - (may reply):  RPC may result in a reply. If it doesn't have one of these
**                two notes, a reply is NOT expected and is an error.
** - (requires x permission):  If the dispatcher receives a RPC that requires
**                            the stated permission on a bridge that does not
**                            have it set, an error will be generated.
**
******************************************************************************/

/*
 * The basic interface from which all other RPCs derive
 */
import {ItemFilter} from "@owlbear-rodeo/sdk";

export interface RPC {
    cmd: "open" | "config" | "ping" | "pong" |
         "set" | "set-item" | "get" | "msg" |
         "reply" |
         "error"
}

/*
 * Sent from Magic Circle immediately after connection established.
 * @remarks (client -> server)
 */
export interface OpenRPC extends RPC {
    cmd: "open",

    // Version number of the wire protocol Magic Circle expects
    version: number,

    // Room ID
    room: string,

    // Any other data that the user configured to be sent
    data?: any
}

/*
  * Manage some aspect of the dispatcher's configuration.
  * @remarks (client <- server) (requires control permission)
  */
export interface ConfigRPC extends RPC {
    cmd: "config",
    subcmd: "reload",
    args: any
}

type TargetType = "room" | "scene" | "item" | "player";

/*
 * Retrieve a value stored somewhere in metadata.
 * @remarks (client <- server) (reply expected) (required read permission)
 */
export interface GetRPC extends RPC {
    cmd: "get",

    // Where the metadata is stored
    target: TargetType,

    // If target == "item", a filter or search string describing the items to retireve
    item?: ItemFilter<any> | string,

    // Metadata key to retrieve
    key: string,

    // Will be included in the reply
    reply_id: number
}

/*
 * Set a value stored in metadata.
 * @remarks (client <- server) (requires write permission)
 */
export interface SetRPC extends RPC {
    cmd: "set",
    target: TargetType,

    // If target == "item", a filter or search string describing the items to modify
    item?: ItemFilter<any> | string,

    // Metadata key to set
    key: string,

    // New value of the metadata
    value: any
}

/*
 * Set an Item's properties
 * @remarks (client <- server) (requires write permission)
 */
export interface SetItemRPC extends RPC {
    cmd: "set-item",

    // A filter or search string describing the items to modify
    item: ItemFilter<any> | string,

    // The property being set
    key: "name" | "visible" | "locked" | "zIndex" | "position" | "rotation" |
        "scale" | "layer" | "attachedTo" | "disableHit" | "disableAutoZIndex",

    // The new value of the property
    value: any
}

/*
 * Post a message to the message buffer
 * @remarks (client <- server) (requires message permission)
 */
export interface MsgRPC extends RPC {
    cmd: "msg",
    // The type of message represented, and the subclass of RPC that can be

    /*
     *  The type of message represented
     * - chat: A human generated chat message
     * - dice: Dice roll information (cast to DiceRPC or DiceMessage)
     * - info: System generated informational message
     */
    type: "chat" | "dice" | "info",

    // Body of the message
    text: string,

    //   Person message is attributed to.  The dispatcher will atempt to
    // associate author by ID if it looks GUID-like, by player name, or by
    // other associations players have claimed.
    author?: string,
    
    //   Person that the message is directed to, frontends should not display
    // the message to anyone else if this field is present.  Note that this is
    // just hidden communication, not private, because anyone cn still look at
    // the Owlbear metadata.  Subject to the same player auto-association as
    // the author field.
    whisper?: string,

    // Optional additional data to be passed
    metadata?: any
}

// Information about one set of dice rolled
export interface RollInfo {
    /*
     * The kind of dice roll being communicated.
     *
     *  This value is largely arbitrary and dependent on the system being
     * rolled, however effort should be made to use consistent terminology
     * so frontends can act on rolls. Recommendations:
     *
     *  - "check": ability/skill checks
     *  - "initiative": initiative rolls
     *  - "attack": to hit rolls
     *  - "damage": damage rolls
     *  - "save": saving throws
     */
    kind: string,

    // An array of the types of all the individual dice to be rolled
    // When a number, the size of the die, when a string an arbitrary identifier for the die type
    dice: Array<number | string>,

    // Modifier to be added to the total sum of the dice
    modifier: number,

    // When a roll is predetermined, the total outcome of the roll
    // When a number, a sum of the results and modifier, when a string an arbitrary identifier
    total?: number | string,

    // When a roll is predetermined, the results of each die corresponding to the dice array
    results?: Array<number | string>
}

/*
 * Post a dice roll to the message buffer.
 * @remarks (client <- server) (requires message permission)
 */
export interface DiceRPC extends MsgRPC {
    cmd: "msg",
    type: "dice",

    metadata: RollInfo;
}

/*
 * A reply to a previous NPC.
 * @remarks (client -> server)
 */
export interface ReplyRPC extends RPC {
    cmd: "reply",

    // Copied from reply_id of original message
    reply_id: number,

    // Contents of the reply
    data: any
}

/*
 * Error notification.
 * @remarks (client <-> server)
 */
export interface ErrorRPC extends RPC {
    cmd: "error",

    // Command and subcommand that originated error
    context: string,

    // If originating RPC had a reply_id, its copied here
    reply_id?: number,

    // Error message
    msg: string
}