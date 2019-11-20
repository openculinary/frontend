import 'jquery';

import { executeSearch, executeView } from './models/search';

export { getState, loadPage, loadState };

function getState() {
  var state = {};
  var urlParams = new URLSearchParams(window.location.hash.slice(1));
  urlParams.forEach(function(value, key) {
    state[key] = value;
  })
  return state;
}

function loadTags(element, data) {
  if (!data) return;
  var tags = $(element).val();
  var terms = data.split(',');
  tags.forEach(function(tag) {
    if (terms.indexOf(tag) >= 0) return;
    $(element).remove(`option[value='${tag}']`);
  });
  terms.forEach(function(term) {
    if (tags.indexOf(term) >= 0) return;
    $(element).append(new Option(term, term, true, true));
  });
}

function loadPage(pageId) {
  $('body > div.container[id]').hide();
  $(`body > div.container[id="${pageId}"]`).show();

  $('header a').removeClass('active');
  $('header a[href="#' + pageId + '"]').addClass('active');
}

function loadState() {
  var state = getState();

  loadTags('#include', state.include);
  loadTags('#exclude', state.exclude);
  loadTags('#equipment', state.equipment);

  $('body > div.container[id]').each(function() {
    if (this.id in state) loadPage(this.id);
  });

  var action = state.action;
  switch (action) {
    case 'join': joinCollaboration(); break;
    case 'search': executeSearch(); break;
    case 'verified': confirmVerified(); break;
    case 'view': executeView(); break;
  }
}
