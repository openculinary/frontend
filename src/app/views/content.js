import $ from 'jquery';

export { renderContent };

function renderContent() {
  var url = $('#content').val();
  $('#content').load(`content/${url$}`);
}
