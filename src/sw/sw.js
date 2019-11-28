workbox.core.skipWaiting();
workbox.core.clientsClaim();

function contentUpdateHandler(event) {
  console.log('updated content detected');
}

const updateChannel = 'precache-channel';
workbox.precaching.addPlugins([new workbox.broadcastUpdate.Plugin(updateChannel)]);
new BroadcastChannel(updateChannel).addEventListener('message', contentUpdateHandler);

function returnResponse(response) { return response; }
function returnEmptyResults() {
  var response = {
    authority: 'local',
    results: [],
    total: 0
  };
  return new Response(JSON.stringify(response), {'status': 200});
}

function searchHandler(event) {
  return fetch(event.request).catch(returnEmptyResults);
}

workbox.routing.registerRoute(
  new RegExp('/api/recipes/search'),
  searchHandler
);

workbox.precaching.precacheAndRoute(self.__precacheManifest);
