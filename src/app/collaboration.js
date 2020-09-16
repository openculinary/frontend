import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const doc = new Y.Doc();
const wsProvider = new WebsocketProvider('ws://localhost/collaboration', 'my-roomname', doc);

wsProvider.on('status', event => {
  console.log(event.status);
})
