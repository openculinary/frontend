import $ from 'jquery';

import { renderRecipe } from './views/recipe';
import { renderSearch } from './views/search';
import { renderExplore } from './views/explore';

export { getState, loadPage, pushState, renderStateHash };

function getState() {
  if (!history.state && !location.hash) return {'search': null};
  if (!history.state && location.hash) {
    var state = {};
    var urlParams = new URLSearchParams(window.location.hash.slice(1));
    urlParams.forEach((value, key) => { state[key] = value });
    return state;
  }
  return history.state;
}

function pushState(state, hash) {
  history.pushState(state, '', hash);
}

function renderStateHash(state) {
    var stateHash = decodeURIComponent($.param(state));
    stateHash = stateHash.split('&').map(item => item.replace(RegExp('=$'), '')).join('&');
    return `#${stateHash}`;
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
  // If we encounter an empty state, display the homepage
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

  var activeTab = $('.modal.show a.active').attr('href');
  if (activeTab && !(activeTab.slice(1) in state)) {
    $('.modal.show').modal('hide');
    activeTab = null;
  }

  if (!activeTab) {
    switch (state.action) {
      case 'search': renderSearch(); break;
      case 'explore': renderExplore(); break;
      case 'view': renderRecipe(); break;
    }
  }
}

$(function() {
  $('#about-modal a').on('shown.bs.tab', function (e) {
    pushState(getState(), e.target.hash);
  });

  window.onpopstate = loadState;
  loadState();
});
