import * as $ from 'jquery';
import jqueryi18next from 'jquery-i18next';

import i18next from 'i18next';
import HTTP from 'i18next-http-backend';
import BrowserLanguage from 'i18next-browser-languagedetector';

export { i18nAttr, localize, resolvedLocale };

function i18nAttr(key: string) : string {
    return `[html]${key}`;
}

const pendingSelectors: string[] = [];

function localize(selector?: string) : void {
  if (!selector) selector = 'body [data-i18n]';
  if (!$.fn.localize) {
    pendingSelectors.push(selector);
    return;
  }
  $(selector).localize();
}

function resolvedLocale() : string {
  return i18next.resolvedLanguage;
}

i18next && void i18next.use(BrowserLanguage).use(HTTP).init({
  ns: [
    'categories',
    'dietary-properties',
    'explore',
    'footer',
    'meal-planner',
    'navigation',
    'problem-reports',
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
