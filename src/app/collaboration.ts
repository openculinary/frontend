import $ from 'jquery';
import * as Y from 'yjs';
import { CodemirrorBinding } from 'y-codemirror';
import { Awareness } from "y-protocols/awareness";
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

import { getNoteEditor, observeNoteUpdates } from './views/shopping-list';

function bindShoppingList(shoppingListNotes, awareness) {
  const editor = getNoteEditor();
  const binding = new CodemirrorBinding(shoppingListNotes, editor, awareness);
  shoppingListNotes.observe(observeNoteUpdates);
}

function renderPeers(peerStates) {
  const collaboration = $('#collaboration').empty();
  peerStates.forEach((state, clientId) => {
    collaboration.append($('<div />', {
      'data-client-id': clientId,
      'text': clientId,
    }));
  })
}

function handleAwarenessUpdates(awareness) {
  awareness.on('change', () => renderPeers(awareness.getStates()));
}

function joinSession(sessionId: string) {
  const doc = new Y.Doc();
  const shoppingListNotes = doc.getText('doc.reciperadar.com/v1/shopping-list/notes');

  const awareness = new Awareness(doc);
  const dbProvider = new IndexeddbPersistence(sessionId, doc);
  const wsProvider = new WebsocketProvider(`${window.location.protocol === 'https:' ? 'wss': 'ws'}://${window.location.host}/collaboration`, sessionId, doc, { awareness });

  dbProvider.on('synced', () => {
    bindShoppingList(shoppingListNotes, awareness);
    handleAwarenessUpdates(awareness);
  });
}

joinSession('example-session-id');

export { joinSession };
