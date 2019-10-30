importScripts('vendors/workbox/workbox-sw.js');

workbox.setConfig({modulePathPrefix: 'vendors/workbox/', debug: false});
workbox.core.clientsClaim();

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

var root = '/';
workbox.precaching.precacheAndRoute([root]);
workbox.routing.registerNavigationRoute(
  workbox.precaching.getCacheKeyForURL(root)
);
