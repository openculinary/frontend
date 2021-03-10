import * as $ from 'jquery';

import { renderRecipe } from './views/recipe';
import { renderSearch } from './views/search';
import { renderExplore } from './views/explore';

export { getState, loadPage, pushState, renderStateHash };

function getState() : Record<string, string> {
  if (!history.state && !location.hash) return {'search': null};
  if (!history.state && location.hash) {
    const state = Object.create(null);
    const urlParams = new URLSearchParams(window.location.hash.slice(1));
    urlParams.forEach((value, key) => { state[key] = value });
    return state;
  }
  return history.state;
}

function pushState(state: Record<string, string>, hash: string) : void {
  history.pushState(state, '', hash);
}

function renderStateHash(state: Record<string, string>) : string {
    let stateHash = decodeURIComponent($.param(state));
    stateHash = stateHash.split('&').map(item => item.replace(RegExp('=$'), '')).join('&');
    return `#${stateHash}`;
}

function resetChoices(selector: string, data?) : void {
  if (!data) $(selector).find('ul').empty();
}

function loadTags(selector: string, data?: string) : void {
  const tags = $(selector).val();
  const terms = data ? data.split(',') : [];
  tags.forEach(function(tag) {
    if (terms.indexOf(tag) >= 0) return;
    $(selector).find(`option[value='${tag}']`).remove();
  });
  terms.forEach(function(term) {
    if (tags.indexOf(term) >= 0) return;
    $(selector).append(new Option(term, term, true, true));
  });
}

function loadPage(pageId: string) : void {
  $('body > div.container[id]').hide();
  $(`body > div.container[id="${pageId}"]`).show();
  $(`body > div.container[id="${pageId}"]`).trigger('page:load');

  $('header a').removeClass('active');
  $('header a[href="#' + pageId + '"]').addClass('active');

  $(window).animate({scrollTop: 0}, 50);
}

function loadAboutTab(tabId: string) : void {
  $('#about-modal').modal('show');
  $('#about-modal a[href="#' + tabId + '"]').tab('show');
}

function loadState() : void {
  // If we encounter an empty state, display the homepage
  const state = getState();

  resetChoices('#explore', state.ingredients);

  loadTags('#include', state.include);
  loadTags('#exclude', state.exclude);
  loadTags('#equipment', state.equipment);

  $('body > div.container[id]').each(function() {
    if (this.id in state) loadPage(this.id);
  });

  $('#about-modal div.tab-pane[id]').each(function() {
    if (this.id in state) loadAboutTab(this.id);
  });

  let activeTab = $('.modal.show a.active').attr('href');
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
