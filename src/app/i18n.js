import 'jquery';
import jqueryi18next from 'jquery-i18next';

import i18next from 'i18next';
import XHR from 'i18next-xhr-backend';
import BrowserLanguage from 'i18next-browser-languagedetector';

export { localize };

var pendingSelectors = [];

function localize(selector) {
  if (!selector) selector = 'body';
  if (!$.fn.localize) {
    pendingSelectors.push(selector);
    return;
  };
  $(selector).localize();
}

i18next.use(BrowserLanguage).use(XHR).init({
  ns: [
    'categories',
    'navigation',
  ],
  fallbackLng: 'en',
  load: 'languageOnly',
  backend: {
    loadPath: 'locales/{{lng}}/{{ns}}.json'
  },
  detection: {
    caches: ['localStorage'],
    order: ['localStorage', 'navigator', 'htmlTag']
  }
}, function() {
  jqueryi18next.init(i18next, $);
  localize();

  var selector;
  while (selector = pendingSelectors.pop()) {
    localize(selector);
  }
});
