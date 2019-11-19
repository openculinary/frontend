const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html />');

global.document = dom.document;
global.window = dom.window;
