import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

const doc = new Y.Doc();
const sessionId = 'example-session-id';
const wsProvider = new WebsocketProvider('ws://localhost/collaboration', sessionId, doc);
const dbProvider = new IndexeddbPersistence(sessionId, doc);

wsProvider.on('status', event => {
  console.log(event.status);
});
dbProvider.on('synced', () => {
  console.log('y-indexeddb synced');
});
