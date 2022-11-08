import { JSDOM } from 'jsdom';
const dom = await JSDOM.fromFile('src/index.html');

global.Element = dom.window.Element;
global.document = dom.window.document;
global.history = dom.window.history;
global.location = dom.window.location;
global.navigator = dom.window.navigator;
global.window = dom.window;
global.self = dom.window;
