import 'jquery';
import jqueryi18next from 'jquery-i18next';

import i18next from 'i18next';
import XHR from 'i18next-xhr-backend';
import BrowserLanguage from 'i18next-browser-languagedetector';

export { localize };

var pendingSelectors = [];

function localize(selector) {
  if (!$.fn.localize) {
    pendingSelectors.push(selector);
    return;
  };

  if (!selector) selector = 'body';
  $(selector).localize();
}

i18next.use(BrowserLanguage).use(XHR).init({
  load: 'languageOnly',
  backend: {
    loadPath: 'i18n/{{lng}}/{{ns}}.json'
  },
  detection: {
    caches: ['localStorage'],
    order: ['localStorage', 'navigator', 'htmlTag']
  }
}, function() {
  jqueryi18next.init(i18next, $);

  var selector;
  while (selector = pendingSelectors.pop()) {
    localize(selector);
  }
});
