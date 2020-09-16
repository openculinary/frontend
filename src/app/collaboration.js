import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const doc = new Y.Doc();
const sessionId = 'example-session-id';
const wsProvider = new WebsocketProvider('ws://localhost/collaboration', sessionId, doc);

wsProvider.on('status', event => {
  console.log(event.status);
})
