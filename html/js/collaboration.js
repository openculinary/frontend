async function createCollaborativeModel(app, model, collaborationId) {
  var localModel = storage[model];
  var sharedModel = collaboration[model] = (await app.collaborate(`${model}-${collaborationId}`, 'rwlwwset')).shared;

  // Wrap rwlwwset mutation functions; automatically supply the current timestamp
  wrapMutators(sharedModel);

  // Create an event listener to upload local state changes
  localModel.sendState = function() {
    sharedModel.applyAndPushDelta(localModel.state());
  };

  // When remote state is received, ...
  var stateChange = 'state changed';
  sharedModel.receiveState = function(fromSelf) {
    // ... apply the changes with state send disabled, avoiding feedback loops
    localModel.removeListener(stateChange, localModel.sendState);
    localModel.apply(sharedModel.state());
    localModel.addListener(stateChange, localModel.sendState);
  };

  // Perform a one-time push of local state to the network on startup
  localModel.sendState();

  // Bind network state update handler
  sharedModel.addListener(stateChange, sharedModel.receiveState);
}

function getCollaborationId(createSession) {
  var fragment = $.bbq.getState('collaborationId');
  if (fragment) {
    window.localStorage.setItem('collaborationId', fragment);
    return fragment;
  }

  var local = window.localStorage.getItem('collaborationId');
  if (local) return local;

  if (createSession) return peerBase.generateRandomName();
}

var app, collaboration = {
  recipes: null,
  meals: null,
  products: null,
};
async function setupCollaboration(collaborationId) {
  app = window.peerBase(`app-${collaborationId}`);
  await app.start();
  $.each(collaboration, async function(model) {
    createCollaborativeModel(app, model, collaborationId);
  });
}

function joinCollaborationSession() {
  var toggle = $('#collaboration-toggle');
  toggle.removeClass();
  toggle.addClass('nav-link fa fa-spinner fa-spin')
  toggle.off('click');

  $.ajaxSetup({'cache': true});
  $.getScript('vendors/npm/peer-base.min.js', async function() {
    var collaborationId = getCollaborationId(true);
    setupCollaboration(collaborationId);

    toggle.removeClass();
    toggle.addClass('nav-link fa fa-share-alt-square')
    toggle.css('color', 'lime');
    toggle.on('click', leaveCollaborationSession);

    var href = `#action=join&collaborationId=${collaborationId}`;
    var link = $('#collaboration-link');
    link.css('color', 'silver');
    link.attr('href', href);
    link.show();
  });
}

function leaveCollaborationSession() {
  $.each(collaboration, async function(model) {
    if (!collaboration[model]) return;
    collaboration[model].stop();
    delete collaboration[model];
  });

  if (app) {;
    app.stop();
    app = null;
  }

  var toggle = $('#collaboration-toggle');
  toggle.css('color', 'dimgray');
  toggle.on('click', joinCollaborationSession);

  var link = $('#collaboration-link');
  link.hide();
}

$(function () {
  leaveCollaborationSession();
  var collaborationId = getCollaborationId();
  if (collaborationId) joinCollaborationSession();
});
