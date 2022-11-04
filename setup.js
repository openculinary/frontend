const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html />');

global.document = dom.window.document;
global.history = dom.window.history;
global.location = dom.window.location;
global.navigator = dom.window.navigator;
global.window = dom.window;
global.self = dom.window;

const jquery = require('jquery');
window.$ = jquery;
