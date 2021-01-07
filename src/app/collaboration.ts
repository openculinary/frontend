import $ from 'jquery';
import * as Y from 'yjs';
import { CodemirrorBinding } from 'y-codemirror';
import { Awareness } from "y-protocols/awareness";
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

import { getNoteEditor, observeNoteUpdates, resetNoteEditor } from './views/shopping-list';

function bindShoppingList(shoppingListNotes, awareness) {
  resetNoteEditor();
  const editor = getNoteEditor();
  const binding = new CodemirrorBinding(shoppingListNotes, editor, awareness);
  shoppingListNotes.observe(observeNoteUpdates);
}

function renderPeers(peerStates) {
  const peers = $('#collaboration .peers').empty();
  peerStates.forEach((state, clientId) => {
    peers.append($('<div />', {
      'data-client-id': clientId,
      'text': state.username || clientId,
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
  connection.append($('<div />', {'html': `Connected to <strong>${wsProvider.roomname}</strong>`}));
  connection.append(disconnect);
}

function clearConnectionStatus() {
  // TODO: i18n
  const connect = $('<button />', {'text': 'Connect'});
  connect.on('click', () => {
    const sessionId = $('#collaboration .connection input.session-id').val();
    const username = $('#collaboration .connection input.username').val();
    joinSession(sessionId, username);
  });

  const connection = $('#collaboration .connection').empty();
  connection.append($('<input />', {'class': 'username', 'type': 'text', 'placeholder': 'anonymous'}));
  connection.append($('<input />', {'class': 'session-id', 'type': 'text', 'placeholder': 'example-session-id'}));
  connection.append(connect);
}

function joinSession(sessionId: string, username: string) {
  const doc = new Y.Doc();
  const shoppingListNotes = doc.getText('doc.reciperadar.com/v1/shopping-list/notes');

  const dbProvider = new IndexeddbPersistence(sessionId, doc);
  dbProvider.on('synced', () => {
    const awareness = new Awareness(doc);

    awareness.setLocalStateField('username', username);
    bindShoppingList(shoppingListNotes, awareness);
    handleAwarenessUpdates(awareness);

    const wsProvider = new WebsocketProvider(`${window.location.protocol === 'https:' ? 'wss': 'ws'}://${window.location.host}/collaboration`, sessionId, doc, { awareness });
    wsProvider.on('status', event => {
      switch (event.status) {
        case 'connected':
          displayConnectionStatus(wsProvider);
          break;
        case 'disconnected':
          dbProvider.destroy();
          awareness.destroy();
          wsProvider.destroy();
          resetNoteEditor();
          clearConnectionStatus();
          break;
      }
    });
  });
}

$(function() {
  clearConnectionStatus();
})
