const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html />');

global.document = dom.window.document;
global.window = dom.window;
global.self = dom.window;

const jquery = require('jquery');
window.$ = jquery;
