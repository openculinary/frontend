import { precacheAndRoute } from '@serwist/precaching';
import { registerRoute } from '@serwist/routing';
import { NetworkFirst } from '@serwist/strategies';

addEventListener('message', (event) => {
  const skipWaitingTypes = {'skipWaiting': null, 'SKIP_WAITING': null};
  if (event.data && event.data.type in skipWaitingTypes) {
    self.skipWaiting();
  }
});

function returnEmptyResults() {
  var response = {
    authority: 'local',
    total: 0,
    results: [],
    facets: {},
    refinements: []
  };
  return new Response(JSON.stringify(response), {'status': 200});
}

function searchHandler(event) {
  return fetch(event.request).catch(returnEmptyResults);
}

registerRoute(new RegExp('/api/recipes/search'), searchHandler);
registerRoute(new RegExp('/(#.*)?'), new NetworkFirst());

precacheAndRoute(self.__SW_MANIFEST);
