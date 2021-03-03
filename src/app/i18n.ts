import $ from 'jquery';
import jqueryi18next from 'jquery-i18next';

import i18next from 'i18next';
import XHR from 'i18next-xhr-backend';
import BrowserLanguage from 'i18next-browser-languagedetector';

export { i18nAttr, localize };

function i18nAttr(key: string) {
    return `[html]${key}`;
}

const pendingSelectors: string[] = [];

function localize(selector?: string) {
  if (!selector) selector = 'body [data-i18n]';
  if (!$.fn.localize) {
    pendingSelectors.push(selector);
    return;
  }
  $(selector).localize();
}

i18next.use(BrowserLanguage).use(XHR).init({
  ns: [
    'categories',
    'dietary-properties',
    'explore',
    'footer',
    'meal-planner',
    'navigation',
    'search',
    'shopping-list',
    'starred-recipes',
  ],
  fallbackLng: 'en',
  load: 'languageOnly',
  initImmediate: false,
  backend: {
    loadPath: 'locales/{{lng}}/{{ns}}.json'
  },
  detection: {
    caches: ['localStorage'],
    order: ['localStorage', 'navigator', 'htmlTag']
  }
}, function() {
  jqueryi18next.init(i18next, $, {useOptionsAttr: true});
  localize();

  let selector: string;
  // eslint-disable-next-line no-cond-assign
  while (selector = pendingSelectors.pop()) {
    localize(selector);
  }
});
