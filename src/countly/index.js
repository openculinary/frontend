/*
import Countly from 'countly-sdk-web';

var hostname = window.location.hostname;
var hostURI = window.location.href.split('#')[0];

var countlyHostname = `countly.${hostname}`;
var countlyURI = hostURI.replace(hostname, countlyHostname).replace('www.', '');

Countly.init({
  app_key: 'cbe9c80e3bae3df51d71ae0fbbfa6498d22c42ca',
  app_version: `${VERSION}`,
  force_post: true,
  require_consent: true,
  url: countlyURI,
  use_session_cookie: false
});
Countly.track_sessions()
Countly.track_pageview()
Countly.track_errors()

const add_event = Countly.add_event;
*/
const add_event = function() {};
export { add_event };
