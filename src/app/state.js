import 'jquery';
import 'bootstrap-tagsinput';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-tagsinput/dist/bootstrap-tagsinput.css'

import { executeSearch, executeView } from './pages/search';

export { getState, loadPage, loadState };

function getState() {
  var state = {};
  var urlParams = new URLSearchParams(window.location.hash.slice(1));
  urlParams.forEach(function(value, key) {
    state[key] = value;
  })
  return state;
}

function loadTags(element, textKey, valueKey, data) {
  if (!data) return;
  var tags = $(element).val();
  var terms = data.split(',');
  tags.forEach(function(tag) {
    if (terms.indexOf(tag) >= 0) return;
    $(element).tagsinput('remove', tag);
  });
  terms.forEach(function(term) {
    if (tags.indexOf(term) >= 0) return;
    var item = {};
    item[textKey] = term;
    item[valueKey] = term;
    $(element).tagsinput('add', item);
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

  loadTags('#include', 'product', 'singular', state.include);
  loadTags('#exclude', 'product', 'singular', state.exclude);
  loadTags('#equipment', 'equipment', 'equipment', state.equipment);

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
