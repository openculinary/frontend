import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

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

registerRoute(
  new RegExp('/api/recipes/search'),
  searchHandler
);

registerRoute(
  new RegExp('/(#.*)?'),
  new NetworkFirst()
);

precacheAndRoute(self.__WB_MANIFEST);
