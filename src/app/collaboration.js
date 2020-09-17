import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

const doc = new Y.Doc();
const docText = doc.get('doc.reciperadar.org', Y.Text);

const sessionId = 'example-session-id';
const wsProvider = new WebsocketProvider('ws://localhost/collaboration', sessionId, doc);
const dbProvider = new IndexeddbPersistence(sessionId, doc);

wsProvider.on('status', event => {
  console.log(`y-websocket ${event.status}`);
});
dbProvider.on('synced', () => {
  console.log('y-indexeddb synced');
});
docText.observe(() => {
  console.log(`y-doc-text: ${docText.toString()}`);
});

docText.insert(0, 'example-text');
