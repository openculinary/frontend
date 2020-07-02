const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html />');
const xmlhttprequest = require('xmlhttprequest');

global.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;
global.document = dom.document;
global.window = dom.window;
global.self = dom.window;

const jquery = require('jquery');
window.$ = jquery;
