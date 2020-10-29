import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

var doc: Y.Doc;
var docText: Y.Text;

function joinSession(sessionId: string) {
  doc = new Y.Doc();
  const wsProvider = new WebsocketProvider('ws://localhost/collaboration', sessionId, doc);
  const dbProvider = new IndexeddbPersistence(sessionId, doc);

  wsProvider.on('status', event => {
    console.log(`y-websocket ${event.status}`);
  });
  dbProvider.on('synced', () => {
    console.log('y-indexeddb synced');
    docText = doc.getText('doc.reciperadar.org');
    docText.observe(() => {
      console.log(`y-doc-text: ${docText.toString()}`);
    });
    docText.insert(0, 'example-text');
  });
}

joinSession('example-session-id');

export { joinSession };
