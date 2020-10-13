import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

addEventListener('message', (event) => {
  const skipWaitingTypes = {'skipWaiting': null, 'SKIP_WAITING': null};
  if (event.data && event.data.type in skipWaitingTypes) {
    self.skipWaiting();
  }
});

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

registerRoute(new RegExp('/api/recipes/search'), searchHandler);
registerRoute(new RegExp('/(#.*)?'), new StaleWhileRevalidate());

precacheAndRoute(['/']);
precacheAndRoute(self.__WB_MANIFEST);
