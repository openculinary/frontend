import 'jquery';

import { renderSearch, renderIndividual } from './views/search';

export { getState, pushState };

function getState() {
  return history.state || {};
}

function pushState(state, hash) {
  history.pushState(state, '', hash);
}

function loadTags(element, data) {
  var tags = $(element).val();
  var terms = data ? data.split(',') : [];
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

  $(window).animate({scrollTop: 0}, 50);
}

function loadAboutTab(tabId) {
  $('#about-modal').modal('show');
  $('#about-modal a[href="#' + tabId + '"]').tab('show');
}

function loadState() {
  // Load any 'about' pages specified in the URL
  var urlParams = new URLSearchParams(window.location.hash.slice(1));
  $('#about-modal div.tab-pane[id]').each(function() {
    if (urlParams.has(this.id)) loadAboutTab(this.id);
  });

  // If we encounter an empty state, display the homepage
  var state = getState();
  if (Object.keys(state).length === 0) {
    loadPage('search');
    return;
  }

  loadTags('#include', state.include);
  loadTags('#exclude', state.exclude);
  loadTags('#equipment', state.equipment);

  $('body > div.container[id]').each(function() {
    if (this.id in state) loadPage(this.id);
  });

  switch (state.action) {
    case 'search': renderSearch(); break;
    case 'view': renderIndividual(); break;
  }
}

$(function() {
  $('#about-modal a').on('shown.bs.tab', function (e) {
    var state = {};
    var tabName = $(e.target).attr('href').substr(1);
    state[tabName] = null;

    var stateHash = decodeURIComponent($.param(state)).slice(0, -1);
    pushState(state, `#${stateHash}`);
  });

  window.onpopstate = loadState;
  loadState();
});
