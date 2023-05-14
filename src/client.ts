import OBR, {Metadata} from "@owlbear-rodeo/sdk"
import {Message} from "./Message";
import {MC_MESSAGES_PATH} from "./constants";
import {MsgRPC} from "./RPC";

/*
 * Register a callback to receive messages via Magic Circle
 * @param startTime - Only messages posted after this timestamp will be passed to callback
 * @param callback - Called with each new message received
 * @return A cleanup function, suitable for use with React's useEffect()
 */
export function onMessage(startTime: number | undefined, callback: (msg: MsgRPC[])=>void) {
    let lastTimestamp = startTime || 0;
    function update(metadata: Metadata) {
        const rawMessages = metadata[MC_MESSAGES_PATH];
        const roomBuffer: Message[] = rawMessages instanceof Array ? rawMessages : [];

        const start = roomBuffer.findIndex((m) => m.time && m.time > lastTimestamp);
        if(start == -1) return;

        lastTimestamp = roomBuffer[roomBuffer.length-1].time || Date.now();
        callback(roomBuffer.slice(start));
    }

    OBR.room.getMetadata().then(update);
    return OBR.room.onMetadataChange(update);
}

/*
 * Send a message over the magic circle message channel.
 * @param msg - The message to be sent.
 */
export async function sendMessage(msg: string | Partial<Message>) {
    const metadata = await OBR.room.getMetadata();
    const rawMessages = metadata[MC_MESSAGES_PATH];
    const roomBuffer: Message[] = rawMessages instanceof Array ? rawMessages : [];

    const nextId = roomBuffer.length == 0 ? 0 : roomBuffer[roomBuffer.length-1].id+1;

    let rawMsg: Partial<MsgRPC> = typeof msg == "string" ? { text: msg } : msg;

    let author: string, player: string | undefined;
    if(rawMsg.author == undefined) {
        author = await OBR.player.getName();
        player = OBR.player.id;
    } else {
        author = rawMsg.author;
    }

    roomBuffer.push({
        cmd: "msg",
        id: nextId,
        time: Date.now(),
        type: rawMsg.type || "chat",
        text: rawMsg.text != undefined ? rawMsg.text.substring(0, 200) : "",
        author: author,
        player: player,
        metadata: rawMsg.metadata
    });
    if(roomBuffer.length >= 5) roomBuffer.shift();

    const update: Partial<any> = {};
    update[MC_MESSAGES_PATH] = roomBuffer;
    await OBR.room.setMetadata(update);
}