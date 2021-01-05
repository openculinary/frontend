import * as Y from 'yjs';
import { CodemirrorBinding } from 'y-codemirror';
import { Awareness } from "y-protocols/awareness";
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

import { getNoteEditor, observeNoteUpdates } from './views/shopping-list';

function bindShoppingList(doc, provider) {
  const text = doc.getText('doc.reciperadar.com/v1/shopping-list/notes');
  const editor = getNoteEditor();
  const binding = new CodemirrorBinding(text, editor, provider.awareness);
  text.observe(observeNoteUpdates);
  text.insert(0, 'example-text');
}

function joinSession(sessionId: string) {
  const doc = new Y.Doc();
  const awareness = new Awareness(doc);
  const wsProvider = new WebsocketProvider('ws://localhost/collaboration', sessionId, doc, { awareness });
  const dbProvider = new IndexeddbPersistence(sessionId, doc);

  wsProvider.on('status', event => {
    console.log(`y-websocket ${event.status}`);
  });
  dbProvider.on('synced', () => {
    console.log('y-indexeddb synced');
    bindShoppingList(doc, wsProvider);
  });
}

joinSession('example-session-id');

export { joinSession };
