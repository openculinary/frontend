import 'jquery';

import { renderSearch, renderIndividual } from './views/search';

export { getState, loadPage, loadState, pushState };

function getState() {
  var state = {};
  var urlParams = new URLSearchParams(window.location.hash.slice(1));
  urlParams.forEach(function(value, key) {
    state[key] = value;
  })
  return state;
}

function pushState(state, hash) {
  if (window.location.hash === hash) return;
  history.pushState(state, '', hash);
  $(window).trigger('hashchange');
}

function loadTags(element, data) {
  if (!data) return;
  var tags = $(element).val();
  var terms = data.split(',');
  tags.forEach(function(tag) {
    if (terms.indexOf(tag) >= 0) return;
    $(element).find(`option[value='${tag}']`).remove();
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

function loadAboutTab(tabId) {
  $('#about-modal').modal('show');
  $('#about-modal a[href="#' + tabId + '"]').tab('show');
}

function loadState() {
  var state = getState();

  loadTags('#include', state.include);
  loadTags('#exclude', state.exclude);
  loadTags('#equipment', state.equipment);

  $('body > div.container[id]').each(function() {
    if (this.id in state) loadPage(this.id);
  });

  $('#about-modal div.tab-pane[id]').each(function() {
    if (this.id in state) loadAboutTab(this.id);
  });

  var action = state.action;
  switch (action) {
    case 'search': renderSearch(); break;
    case 'view': renderIndividual(); break;
  }
}

$(function() {
  $('#about-modal a').on('shown.bs.tab', function (e) {
    var href = $(e.target).attr('href');
    var state = {href: null};

    var stateHash = decodeURIComponent($.param(state));
    pushState(state, `#${stateHash}`);
  });

  window.onhashchange = loadState;
  loadState();
});
