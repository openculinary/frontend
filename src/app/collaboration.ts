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
  const peers = $('#collaboration peers').empty();
  peerStates.forEach((state, clientId) => {
    peers.append($('<div />', {
      'data-client-id': clientId,
      'text': clientId,
    }));
  })
}

function handleAwarenessUpdates(awareness) {
  awareness.on('change', () => renderPeers(awareness.getStates()));
}

function displayConnectionStatus(wsProvider) {
  // TODO: i18n
  const disconnect = $('<button />', {'text': 'Disconnect'});
  disconnect.on('click', () => wsProvider.disconnect());

  const connection = $('#collaboration .connection').empty();
  connection.append($('<div />', {'text': `Connected to ${wsProvider.roomname}`}));
  connection.append(disconnect);
}

function clearConnectionStatus() {
  // TODO: i18n
  const connect = $('<button />', {'text': 'Connect'});
  connect.on('click', () => {
    const sessionId = $('#collaboration .connection input.session-id').val();
    joinSession(sessionId);
  });

  const connection = $('#collaboration .connection').empty();
  connection.append($('<input />', {'class': 'session-id', 'type': 'text', 'placeholder': 'example-session-id'}));
  connection.append(connect);
}

function joinSession(sessionId: string) {
  const doc = new Y.Doc();
  const shoppingListNotes = doc.getText('doc.reciperadar.com/v1/shopping-list/notes');

  const dbProvider = new IndexeddbPersistence(sessionId, doc);
  dbProvider.on('synced', () => {
    const awareness = new Awareness(doc);
    bindShoppingList(shoppingListNotes, awareness);
    handleAwarenessUpdates(awareness);

    // Once the local state is synced, open a websocket connection
    const wsProvider = new WebsocketProvider(`${window.location.protocol === 'https:' ? 'wss': 'ws'}://${window.location.host}/collaboration`, sessionId, doc, { awareness });

    // Configure connection event handling
    wsProvider.on('status', event => {
      switch (event.status) {
        case 'connected':
          displayConnectionStatus(wsProvider);
          break;
        case 'disconnected':
          dbProvider.destroy();
          awareness.destroy();
          wsProvider.destroy();
          clearConnectionStatus();
          break;
      }
    });
  });
}

$(function() {
  clearConnectionStatus();
})
