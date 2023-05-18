# magic-circle-api
  Magic Circle is a system that facilitates communication between Owlbear 
and the outside world. The system consists of three parts:
 - Sources that run outside Owlbear and provide a feed of events (chat 
  messages, die rolls, status updates, etc) and RPCs.
 - Owlbear Rodeo extensions that are interested in subscribing to these 
  events.
 - The Magic Circle extension itself that connects to sources and dispatches 
  the events received. 

This repository contains the common typescript API between Magic Circle and 
frontend extensions, and documents the RPC protocol used by data sources.

# Integrating Magic Circle

## In an Owlbear Extension
Magic Circle provides a React compatible onMessage() hook that, it is 
hoped, will allow you to access the message stream with minimum disruption 
to your code. As an example, the following React component is paraphrased 
from the proof of concept Sending Stones extension, and is the entirety of 
its interaction with Magic Circle:
### Message Log Example
```typescript jsx
function MessageBox() {
	const [messageLog, setMessageLog] = useState(() => new Array<Message>());
	
	useEffect(() => MagicCircle.onMessage(messageLog[messageLog.length - 1],
		(msgs: Message[]) => {
			setMessageLog([...messageLog, ...msgs]);
	}), [messageLog]);
	
	return (
		<div className="message-box">
			{messageLog.map((m) => <MessageBubble key={m.id} message={m} />)}
		</div>
	);
}
```
Notes:
 - onMessage() requires you to keep one additional piece of react state: the 
   most recent message received. 
 - you receive an array of all the messages posted since your most recent one

### Message format

The format of the Message is described in [Message.ts](src/Message.ts) and 
[RPC.ts](src/RPC.ts) (where Message is a superset of the fields in MsgRPC) 
but here is an outline of its most important fields:  

 - **type**: Category of message received, one of:
   - **chat**: Chat message
   - **dice**: Dice roll event
   - **info**: Non-human-generated status message
 - **player**: ID of player 
 - **author**: Name that message is attributed to
 - **metadata**: Data payload of message, if type=="dice" it looks like:
   - **kind**: Kind of roll described, attack, initiative, save, etc
   - **total**: The total result of the roll, if resolved
   - **dice**: Array of the individual dice involved in the roll
   - **suffix**: The suffix part of a dicestring, any operators 
     applied (kh/hl/etc) and its +/- modifier
   - **results**: Array of each die's individual value

### Initiative feed example

  As another example, here's how you might grab initiative rolls from the 
Magic Circle message stream:
```typescript jsx
const [lastMessage, setLastMessage] = useState();
useEffect(() => MagicCircle.onMessage(lastMessage, (msgs) => {
	for(const msg of msgs) {
		// Filter out any non-dice or non-initiative roll events
		if(msg.type != "dice" || msg.metadata.kind != "initiative") continue;
		// Additionally check whether it has a total or is an unresolved roll
		if(!msg.metadata.total) continue;
		
		/*
		** Do your initative tracking work here
		** msg.metadata.total will contain the value of the roll
		** Cross-reference with either the character name that msg.author
		** likely contains, or the player ID stored in msg.player.
		*/
		
		setLastMessage(msg);
	}
}));
```

## Writing a data source

WIP documentation, more here later.
 Long story short: write a WS server, add URL to Magic Circle, extension will  
connect, send JSON RPC messages as laid out in [RPC.ts](src/RPC.ts)