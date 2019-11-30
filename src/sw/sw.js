addEventListener('message', (event) => {
  if (event.data && event.data.type == 'skipWaiting') {
    skipWaiting();
  }
});

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

workbox.routing.registerRoute(
  '/',
  new workbox.strategies.NetworkFirst()
);

workbox.precaching.precacheAndRoute(self.__precacheManifest);
