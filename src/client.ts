import OBR, {Metadata} from "@owlbear-rodeo/sdk"
import {MsgRPC} from "./RPC";
import {MC_MESSAGES_PATH} from "./constants";

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
        const roomBuffer: MsgRPC[] = rawMessages instanceof Array ? rawMessages : [];

        const start = roomBuffer.findIndex((m) => m.time && m.time > lastTimestamp);
        if(start == -1) return;

        lastTimestamp = roomBuffer[roomBuffer.length-1].time || Date.now();
        callback(roomBuffer.slice(start));
    }

    OBR.room.getMetadata().then(update);
    return OBR.room.onMetadataChange(update);
}

// escape html and potentially truncate submitted text
function sanitizeText(unsafe: string, maxSize = -1) {
    let text = unsafe.replaceAll(/[<>&"']/g, (c) => {
        switch(c) {
            case '&': return "&amp;";
            case '<': return "&lt;";
            case '>': return "&gt;";
            case '"': return "&quot";
            case '\'': return "&#39";
            default: return c;
        }
    });

    if(maxSize >= 0 && text.length > maxSize) text = text.substring(0, maxSize);
    return text;
}

/*
 * Send a message over the magic circle message channel.
 * @param msg - The message to be sent.
 */
export async function sendMessage(msg: MsgRPC) {
    const metadata = await OBR.room.getMetadata();
    const rawMessages = metadata[MC_MESSAGES_PATH];
    const roomBuffer: MsgRPC[] = rawMessages instanceof Array ? rawMessages : [];

    roomBuffer.push({
        cmd: "msg",
        time: msg.time || Date.now(),
        type: msg.type,
        text: sanitizeText(msg.text),
        author: msg.author != undefined ? sanitizeText(msg.author) : undefined,
        metadata: msg.metadata
    });
    if(roomBuffer.length >= 5) roomBuffer.shift();

    const update: Partial<any> = {};
    update[MC_MESSAGES_PATH] = roomBuffer;
    await OBR.room.setMetadata(update);
}