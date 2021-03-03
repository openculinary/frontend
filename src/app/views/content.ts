import $ from 'jquery';

export { renderContent };

function renderContent() : void {
  const url = $('#content').val();
  $('#content').load(`content/${url}`);
}
