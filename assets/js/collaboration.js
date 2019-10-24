async function createCollaborativeModel(app, model, collaboration) {
  var name = `${model}-${collaboration.id}`;
  var type = 'rwlwwset';
  var options = {keys: collaboration.keys ? window.peerBase.keys.uriDecode(collaboration.keys) : null};

  var localModel = storage[model];
  var sharedModel = collaborations[model] = (await app.collaborate(name, type, options)).shared;

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

async function getCollaboration(create) {
  var fragmentId = $.bbq.getState('collaborationId');
  if (fragmentId) {
    var fragmentKeys = $.bbq.getState('collaborationKeys');
    return {
      id: fragmentId,
      keys: fragmentKeys
    }
  }

  var localId = window.localStorage.getItem('collaborationId');
  if (localId) {
    var localKeys = window.localStorage.getItem('collaborationKeys');
    return {
      id: localId,
      keys: localKeys
    }
  }

  if (create) {
    var randomId = peerBase.generateRandomName();
    var randomKeys = window.peerBase.keys.uriEncode(await peerBase.keys.generate());
    return {
      id: randomId,
      keys: randomKeys
    }
  }
}

function generateKeys() {
}

var app, collaborations = {
  recipes: null,
  meals: null,
  products: null,
};
async function setupCollaboration(collaboration) {
  window.localStorage.setItem('collaborationId', collaboration.id);
  window.localStorage.setItem('collaborationKeys', collaboration.keys);

  app = window.peerBase(`app-${collaboration.id}`);
  await app.start();

  $.each(collaborations, async function(model) {
    createCollaborativeModel(app, model, collaboration);
  });
}

function joinCollaboration() {
  if (app) return;

  var toggle = $('#collaboration-toggle');
  toggle.removeClass();
  toggle.addClass('nav-link fa fa-spinner fa-spin')
  toggle.off('click');

  $.ajaxSetup({'cache': true});
  $.getScript('vendors/npm/peer-base.min.js', async function() {
    var collaboration = await getCollaboration(true);
    await setupCollaboration(collaboration);

    toggle.removeClass();
    toggle.addClass('nav-link fa fa-share-alt-square')
    toggle.css('color', 'lime');
    toggle.on('click', leaveCollaboration);

    var href = `#action=join&collaborationId=${collaboration.id}&collaborationKeys=${collaboration.keys}`;
    var link = $('#collaboration-link');
    link.css('color', 'silver');
    link.attr('href', href);
    link.show();
  });
}

function leaveCollaboration() {
  $.each(collaborations, async function(model) {
    if (!collaborations[model]) return;
    collaborations[model].stop();
    delete collaborations[model];
  });

  if (app) {;
    window.localStorage.removeItem('collaborationId');
    window.localStorage.removeItem('collaborationKeys');

    app.stop();
    app = null;
  }

  var toggle = $('#collaboration-toggle');
  toggle.css('color', 'dimgray');
  toggle.on('click', joinCollaboration);

  var link = $('#collaboration-link');
  link.hide();
}

$(function () {
  leaveCollaboration();
  var collaboration = getCollaboration().then(function(collaboration) {
    if (collaboration) joinCollaboration();
  });
});
