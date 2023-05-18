import OBR, {Metadata, Player} from "@owlbear-rodeo/sdk"
import {Message} from "./Message";
import {MC_MESSAGES_PATH, MC_PLAYER_ALIAS_PATH} from "./constants";
import {MsgRPC} from "./RPC";

/*
 * Register a callback to receive messages via Magic Circle
 * @param mostRecent - Only messages posted after this message will be sent to client
 * @param callback - Called with each new message received
 * @return A cleanup function, suitable for use with React's useEffect()
 */
export function onMessage(mostRecent: Message | null, callback: (msg: Message[])=>void) {
    let lastId = mostRecent?.id || -1;
    function update(metadata: Metadata) {
        const rawMessages = metadata[MC_MESSAGES_PATH];
        const roomBuffer: Message[] = rawMessages instanceof Array ? rawMessages : [];

        const start = roomBuffer.findIndex((m) => m.id > lastId);
        if(start == -1) return;

        lastId = roomBuffer[roomBuffer.length-1].id;
        callback(roomBuffer.slice(start));
    }

    OBR.room.getMetadata().then(update);
    return OBR.room.onMetadataChange(update);
}

/*
 * Send a message over the magic circle message channel.
 *
 *  Always batch if multiple messages are to be sent in sequence to
 *  prevent messages dropped to Owlbear's own metadata update batching.
 *
 * @param msg - The message(s) to be sent.
 */
export async function sendMessage(msg: string | Partial<MsgRPC> | (string | Partial<MsgRPC>)[]) {
    const metadata = await OBR.room.getMetadata();
    const rawMessages = metadata[MC_MESSAGES_PATH];
    const roomBuffer: Message[] = rawMessages instanceof Array ? rawMessages : [];

    console.log("sendMessage() batch", msg);

    const batch = msg instanceof Array ? msg : [msg];
    for(const msg of batch) {
        console.log("->", batch, msg);
        let rawMsg: Partial<MsgRPC> = typeof msg === "string" ? { text: msg } : msg;

        // Author/player attribution
        let author: string, player: string | undefined;
        if(rawMsg.author == undefined) {
            author = await OBR.player.getName();
            player = OBR.player.id;
        } else {
            const found = await findPlayer(rawMsg.author);
            if(found) {
                author = found.name;
                player = found.id;
            } else {
                author = rawMsg.author;
            }
        }

        // Generate a new sanitized cooked message and post it to the bus
        const nextId = roomBuffer.length == 0 ? 0 : roomBuffer[roomBuffer.length-1].id+1;
        roomBuffer.push({
            cmd: "msg",
            id: nextId, time: Date.now(),
            type: rawMsg.type || "chat",
            text: rawMsg.text != undefined ? rawMsg.text.substring(0, 200) : "",
            author: author, player: player,
            metadata: rawMsg.metadata
        });
        if(roomBuffer.length >= 5) roomBuffer.shift();
    }

    const update: Partial<any> = {};
    update[MC_MESSAGES_PATH] = roomBuffer;
    await OBR.room.setMetadata(update);
}

/*
 * Attempt to find a player by name, player ID, or assigned player aliases.
 * @return The player ID associated with the subject string or undefined if no player found.
 */
export async function findPlayer(subject: string): Promise<Player | undefined> {
    //   In multiple passes, we first try to find a player by id, then by name, then by
    // aliases assigned in their metadata.
    const predicates = [
        (p: Player) => p.id == subject,
        (p: Player) => p.name == subject,
        (p: Player) => {
            const aliases: Array<string> | unknown | undefined = p.metadata[MC_PLAYER_ALIAS_PATH];
            if(!(aliases && aliases instanceof Array)) return false;
            return aliases.find((a) => a == subject) != undefined;
        }
    ];

    const players = await OBR.party.getPlayers();
    for(const predicate of predicates) {
        const found = players.find(predicate);
        if(found) return found;
    }
    return;
}