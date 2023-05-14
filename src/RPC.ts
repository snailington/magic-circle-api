export interface RPC {
    cmd:
        "open" | "config" | "ping" | "pong" |
        "set" | "set-item" | "get" | "msg" |
        "reply" |
        "error"
}

// Sent from Magic Circle immediately after bridge is opened.
export interface OpenRPC extends RPC {
    cmd: "open",

    // Version number of the wire protocol Magic Circle expects
    version: number,

    // Room ID
    room: string,

    // Any other data that the user configured to be sent
    data: any | undefined
}

// Dispatcher configuration command (requires control permission)
export interface ConfigRPC extends RPC {
    cmd: "config",
    subcmd: "reload",
    args: any
}

type TargetType = "room" | "scene" | "item" | "player";

// Get a value stored in metadata (expects reply) (requires read permission)
export interface GetRPC extends RPC {
    cmd: "get",

    target: TargetType,

    // If target == "item", the guid of the item in question
    item: string | undefined,

    // Metadata key to retrieve
    key: string,

    // Will be included in the reply
    reply_id: number
}

// Set a value stored in metadata (requires write permission)
export interface SetRPC extends RPC {
    cmd: "set",
    target: TargetType,

    // If target == "item", the guid of the item in question
    item: string | undefined,

    // Metadata key to set
    key: string,

    // New value of the metadata
    value: any
}

// Set a property associated with an item (requires write permission)
export interface SetItemRPC extends RPC {
    cmd: "set-item",

    // The ID of the item in question
    item: string,

    // The property being set
    key: "name" | "visible" | "locked" | "zIndex" | "position" | "rotation" |
        "scale" | "layer" | "attacedTo" | "disableHit" | "disableAutoZIndex",

    // The new value of the property
    value: any
}

// Send a message (requires message or write permission)
export interface MsgRPC extends RPC {
    cmd: "msg",
    type: "chat" | "dice" | "info",

    // Body of the message
    text: string,

    //   Person message is attributed to.  The dispatcher will atempt to
    // associate author by ID if it looks GUID-like, by player name, or by
    // other associations players have claimed.
    author: string | undefined,
    
    // Optional additional data to be passed
    metadata: any
}

// Send a dice roll (requires message or write permission)
export interface DiceRPC extends MsgRPC {
    cmd: "msg",
    type: "dice",
    
    metadata: {
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
        modifier: number | undefined,

        ///// Predetermined dice rolls:
        // The total outcome of the roll
        total: number | string | undefined,

        // Individul die results corresponding to the dice array
        results: Array<number | string> | undefined
    }
}

// Reply to a previous RPC 
export interface ReplyRPC extends RPC {
    cmd: "reply",

    // Copied from reply_id of original message
    reply_id: number,

    // Contents of the reply
    data: any
}

export interface ErrorRPC extends RPC {
    cmd: "error",

    // Command and subcommand that originated error
    context: string,

    // If originating RPC had a reply_id, its copied here
    reply_id: number | undefined,

    // Error message
    msg: string
}