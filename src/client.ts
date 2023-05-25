import OBR, {Metadata, Player} from "@owlbear-rodeo/sdk"
import {Message} from "./Message";
import {MC_ROOM_MESSAGES_PATH, MC_PLAYER_ALIAS_PATH} from "./constants";
import {MsgRPC, RollInfo} from "./RPC";
import {isGuid} from "./utility";

/*
 * Register a callback to receive messages via Magic Circle
 * @param mostRecent - Only messages posted after this message will be sent to client
 * @param callback - Called with each new message received
 * @return A cleanup function, suitable for use with React's useEffect()
 */
export function onMessage(mostRecent: Message | null, callback: (msg: Message[])=>void) {
    let lastId = mostRecent?.id || -1;
    function update(metadata: Metadata) {
        const rawMessages = metadata[MC_ROOM_MESSAGES_PATH];
        const roomBuffer: Message[] = rawMessages instanceof Array ? rawMessages : [];

        const start = roomBuffer.findIndex((m) => m.id > lastId);
        if(start == -1) return;

        lastId = roomBuffer[roomBuffer.length-1].id;
        callback(roomBuffer.slice(start).filter((m) => !m.whisper || m.whisper == OBR.player.id));
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
 * @param player - Player to which the message will be assigned, or leave
 *   undefined for auto attribution.
 */
export async function sendMessage(msg: string | Partial<MsgRPC> | (string | Partial<MsgRPC>)[], player?: string) {
    const metadata = await OBR.room.getMetadata();
    const rawMessages = metadata[MC_ROOM_MESSAGES_PATH];
    const roomBuffer: Message[] = rawMessages instanceof Array ? rawMessages : [];

    const batch = msg instanceof Array ? msg : [msg];
    for(const msg of batch) {
        let rawMsg: Partial<MsgRPC> = typeof msg === "string" ? { text: msg } : msg;

        // Author/player attribution
        let author: string
        if(rawMsg.author == undefined) {
            author = await OBR.player.getName();
            if(player == undefined) player = OBR.player.id;
        } else {
            author = rawMsg.author;

            if(player == undefined) {
                const found = await findPlayer(rawMsg.author);
                if(found) {
                    if(isGuid(rawMsg.author)) author = found.name;
                    player = found.id;
                }
            }
        }

        // Generate a new sanitized cooked message and post it to the bus
        const nextId = roomBuffer.length == 0 ? 0 : roomBuffer[roomBuffer.length-1].id+1;
        roomBuffer.push({
            cmd: "msg",
            id: nextId, time: Date.now(),
            type: rawMsg.type || "chat",
            text: rawMsg.text != undefined ? rawMsg.text.substring(0, 200) : "",
            author: author, player: player || OBR.player.id,
            metadata: rawMsg.metadata
        });
        if(roomBuffer.length >= 5) roomBuffer.shift();
    }

    const update: Partial<any> = {};
    update[MC_ROOM_MESSAGES_PATH] = roomBuffer;
    await OBR.room.setMetadata(update);
}

/*
 * Build a human readable dicestring from a message's RollInfo
 * @param rollInfo - the roll from which the dice string will be constructed
 * @param suffix - if true, suffix will be included
 */
export function toDiceString(rollInfo: RollInfo, suffix = true): string {
    let diceString = "";

    for(const diceType of new Set(rollInfo.dice)) {
        const count = rollInfo.dice.reduce((acc: number, d) => d == diceType ? acc + 1 : acc, 0);
        diceString += `${count}d${diceType} `;
    }
    diceString = diceString = diceString.trimEnd();
    if(suffix) diceString += (rollInfo.suffix || "");

    return diceString;
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

/*
 * Add an alias to the current player's list of claimed aliases.
 * Messages attributed to this alias will become associated with this player.
 * @param alias - The alias to claim.
 */
export async function claimAlias(alias: string) : Promise<void> {
    const metadata = await OBR.player.getMetadata();
    let aliases: any = metadata[MC_PLAYER_ALIAS_PATH];
    if(!aliases || !(aliases instanceof Array)) aliases = new Array<string>()
    else aliases = Array.from(aliases);

    if(aliases.find((a: string) => a == alias)) return;

    aliases.push(alias);
    const updated: Partial<Metadata> = {};
    updated[MC_PLAYER_ALIAS_PATH] = aliases;
    await OBR.player.setMetadata(updated);
}

/*
 * Remove an alias from the current player's list of claimed aliases.
 */
export async function unclaimAlias(alias: string) : Promise<void> {
    const metadata = await OBR.player.getMetadata();
    let aliases: any = metadata[MC_PLAYER_ALIAS_PATH];
    if(!aliases || !(aliases instanceof Array)) aliases = new Array<string>();
    else aliases = Array.from(aliases);

    const idx = aliases.findIndex((a: string) => a == alias);
    if(idx == -1) return;

    aliases.splice(idx, 1);
    const updated: Partial<Metadata> = {};
    updated[MC_PLAYER_ALIAS_PATH] = aliases;
    await OBR.player.setMetadata(updated);
}