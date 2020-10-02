const setGlobalVars = require('indexeddbshim');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html />');
const xmlhttprequest = require('xmlhttprequest');

global.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;
global.document = dom.document;
global.window = dom.window;
global.self = dom.window;

setGlobalVars(global.window, {checkOrigin: false, memoryDatabase: ":memory:"});

const jquery = require('jquery');
window.$ = jquery;

process.on('unhandledRejection', (reason, promise) => {
  if (reason.name === 'DatabaseClosedError') return;
  throw promise;
});
