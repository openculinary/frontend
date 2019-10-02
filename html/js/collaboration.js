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
  var collaborationId;
  if (!collaborationId) collaborationId = $.bbq.getState('collaborationId');
  if (!collaborationId) collaborationId = window.localStorage.getItem('collaborationId');
  if (!collaborationId) collaborationId = createSession ? peerBase.generateRandomName() : null;
  if (createSession) window.localStorage.setItem('collaborationId', collaborationId);
  return collaborationId;
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
  var link = $('#collaboration-link');
  link.removeClass();
  link.addClass('nav-link fa fa-spinner fa-spin')
  link.off('click');

  $.ajaxSetup({'cache': true});
  $.getScript('vendors/npm/peer-base.min.js', async function() {
    var collaborationId = getCollaborationId(true);
    setupCollaboration(collaborationId);

    link.removeClass();
    link.addClass('nav-link fa fa-share-alt-square')
    link.css('color', 'lime');
    link.on('click', leaveCollaborationSession);

    window.location.href = `#action=join&collaborationId=${collaborationId}`;
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

  var link = $('#collaboration-link');
  link.attr('href', null);
  link.css('color', 'silver');
  link.on('click', joinCollaborationSession);
}

$(function () {
  leaveCollaborationSession();
  var collaborationId = getCollaborationId();
  if (collaborationId) joinCollaborationSession();
});
