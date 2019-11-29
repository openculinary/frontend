import Countly from 'countly-sdk-web';

var hostname = window.location.hostname;
var hostURI = window.location.href.split('#')[0];

var countlyHostname = `countly.${hostname}`;
var countlyURI = hostURI.replace(hostname, countlyHostname);

Countly.init({
  app_key: 'tbd',
  force_post: true,
  url: countlyURI,
  use_session_cookie: false
});
Countly.track_sessions()
Countly.track_pageview()
Countly.track_errors()
