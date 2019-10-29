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
  loadTags('#include', 'product', 'singular', $.bbq.getState('include'));
  loadTags('#exclude', 'product', 'singular', $.bbq.getState('exclude'));
  loadTags('#equipment', 'equipment', 'equipment', $.bbq.getState('equipment'));

  $('body > div.container[id]').each(function() {
    if (this.id in $.bbq.getState()) loadPage(this.id);
  });

  var action = $.bbq.getState('action');
  switch (action) {
    case 'join': joinCollaboration(); break;
    case 'search': executeSearch(); break;
    case 'verified': confirmVerified(); break;
    case 'view': executeView(); break;
  }
}

$(window).on('hashchange', loadState);
$(loadState);
